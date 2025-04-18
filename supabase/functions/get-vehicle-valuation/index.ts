/**
 * Vehicle Valuation Edge Function
 * Updated: 2025-04-18 - Fixed Deno imports and md5 implementation
 */

import { serve } from "https://deno.land/std@0.217.0/http/server.ts";
import { corsHeaders } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
// Fixed import for crypto instead of md5
import { crypto } from "https://deno.land/std@0.217.0/crypto/mod.ts";

// Type definitions
interface ValuationData {
  vin: string;
  make?: string;
  model?: string;
  year?: number;
  price?: number;
  mileage?: number;
  valuation?: number;
  reservePrice?: number;
}

// MD5 implementation using crypto
function md5(message: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = crypto.subtle.digestSync("MD5", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Response formatting
const formatSuccessResponse = (data: any) => {
  return new Response(
    JSON.stringify({
      success: true,
      data
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    }
  );
};

const formatErrorResponse = (error: string, status = 400, code = 'ERROR') => {
  return new Response(
    JSON.stringify({
      success: false,
      error,
      code
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    }
  );
};

// Validation helpers
const isValidVin = (vin: string): boolean => {
  if (!vin || typeof vin !== 'string') return false;
  // Basic validation - VINs should be 17 characters and contain only valid characters
  return /^[A-HJ-NPR-Z0-9]{17}$/i.test(vin);
};

const isValidMileage = (mileage: any): boolean => {
  if (mileage === undefined || mileage === null) return false;
  const mileageNumber = Number(mileage);
  return !isNaN(mileageNumber) && mileageNumber >= 0 && mileageNumber <= 1000000;
};

// Logging utilities
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const logOperation = (
  operation: string, 
  details: Record<string, any>,
  level: LogLevel = 'info'
): void => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    operation,
    level,
    ...details
  };
  
  switch (level) {
    case 'error':
      console.error(JSON.stringify(logEntry));
      break;
    case 'warn':
      console.warn(JSON.stringify(logEntry));
      break;
    case 'debug':
      console.debug(JSON.stringify(logEntry));
      break;
    default:
      console.log(JSON.stringify(logEntry));
  }
};

// Calculate valuation checksum - Fixed implementation
const calculateValuationChecksum = (apiId: string, apiSecret: string, vin: string): string => {
  const checksumContent = apiId + apiSecret + vin;
  return md5(checksumContent);
};

// Create Supabase client
const getSupabaseClient = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  }
  
  return createClient(supabaseUrl, supabaseKey);
};

// Main function handler
serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { vin, mileage, gearbox } = await req.json();

    // Log the incoming request
    logOperation('valuation_request_received', { vin, mileage, gearbox });
    
    // Basic validation
    if (!isValidVin(vin)) {
      return formatErrorResponse("Invalid VIN format", 400, "VALIDATION_ERROR");
    }
    
    if (!isValidMileage(mileage)) {
      return formatErrorResponse("Invalid mileage value", 400, "VALIDATION_ERROR");
    }

    // Get Supabase client
    const supabase = getSupabaseClient();

    // Check cache first
    const { data: cachedData, error: cacheError } = await supabase
      .from('vin_valuation_cache')
      .select('valuation_data')
      .eq('vin', vin)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!cacheError && cachedData?.valuation_data) {
      logOperation('using_cached_valuation', { vin });
      return formatSuccessResponse(cachedData.valuation_data);
    }

    // Calculate valuation using external API
    const apiId = Deno.env.get("VALUATION_API_ID") || "";
    const apiSecret = Deno.env.get("VALUATION_API_SECRET") || "";
    
    const checksum = calculateValuationChecksum(apiId, apiSecret, vin);
    
    // Call external valuation API
    const valuationUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${apiId}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/currency:PLN`;
    
    const response = await fetch(valuationUrl);
    const valuationData = await response.json();

    if (!valuationData || valuationData.error) {
      return formatErrorResponse(
        valuationData.error || "Failed to get valuation",
        400,
        "VALUATION_ERROR"
      );
    }

    // Store in cache
    const { error: insertError } = await supabase
      .from('vin_valuation_cache')
      .insert({
        vin,
        mileage,
        valuation_data: valuationData,
        created_at: new Date().toISOString()
      });

    if (insertError) {
      logOperation('cache_insert_error', { error: insertError.message }, 'error');
    }

    return formatSuccessResponse(valuationData);

  } catch (error) {
    logOperation('valuation_error', { 
      error: error.message,
      stack: error.stack
    }, 'error');
    
    return formatErrorResponse(
      `Error processing valuation request: ${error.message}`,
      500,
      "INTERNAL_ERROR"
    );
  }
});
