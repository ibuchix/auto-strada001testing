
/**
 * Vehicle Valuation Edge Function
 * Updated: 2025-04-20 - Fixed MD5 implementation and improved error handling
 */

import { serve } from "https://deno.land/std@0.217.0/http/server.ts";
import { corsHeaders } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
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

// Response formatting
const formatSuccessResponse = (data: any)  => {
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

// FIXED: Corrected MD5 implementation
function md5(message: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = crypto.subtle.digestSync("MD5", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Calculate valuation checksum
const calculateValuationChecksum = (apiId: string, apiSecret: string, vin: string): string => {
  const checksumContent = apiId + apiSecret + vin;
  // FIXED: Properly call the md5 function
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
    const { vin, mileage, gearbox, allowExisting = false } = await req.json();

    // Log the incoming request
    logOperation('valuation_request_received', { vin, mileage, gearbox, allowExisting });
    
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
      
      // Add debug information to help with UI rendering
      const enhancedCacheData = {
        ...cachedData.valuation_data,
        fromCache: true,
        debugInfo: {
          source: 'cache',
          timestamp: new Date().toISOString()
        }
      };
      
      return formatSuccessResponse(enhancedCacheData);
    }

    // Calculate valuation using external API
    const apiId = Deno.env.get("VALUATION_API_ID") || "";
    const apiSecret = Deno.env.get("VALUATION_API_SECRET") || "";
    
    // FIXED: Use the corrected checksum calculation
    const checksum = calculateValuationChecksum(apiId, apiSecret, vin);
    
    // Call external valuation API
    const valuationUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${apiId}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/currency:PLN`;
    
    logOperation('calling_external_api', { url: valuationUrl }) ;
    
    const response = await fetch(valuationUrl);
    
    // Log the raw response for debugging
    logOperation('external_api_response', { 
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    const valuationData = await response.json();
    
    // Log the parsed response data
    logOperation('external_api_data', { 
      hasData: !!valuationData,
      isError: !!valuationData.error,
      dataKeys: valuationData ? Object.keys(valuationData) : []
    });

    if (!valuationData || valuationData.error) {
      return formatErrorResponse(
        valuationData.error || "Failed to get valuation",
        400,
        "VALUATION_ERROR"
      );
    }

    // ADDED: Extract and calculate pricing information
    const enhancedValuationData = enhanceValuationData(valuationData, vin, mileage);
    
    // Store in cache
    const { error: insertError } = await supabase
      .from('vin_valuation_cache')
      .insert({
        vin,
        mileage,
        valuation_data: enhancedValuationData,
        created_at: new Date().toISOString()
      });

    if (insertError) {
      logOperation('cache_insert_error', { error: insertError.message }, 'error');
    }

    return formatSuccessResponse(enhancedValuationData);

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

// ADDED: Function to enhance valuation data with pricing information
function enhanceValuationData(data: any, vin: string, mileage: number): any {
  // Create a copy of the original data
  const enhanced = { ...data, vin, mileage };
  
  // Extract make, model, year
  const make = data.make || data.brand || '';
  const model = data.model || '';
  const year = data.year || data.productionYear || 0;
  
  // Set these values explicitly to ensure they're available
  enhanced.make = make;
  enhanced.model = model;
  enhanced.year = year;
  
  // Extract or calculate pricing information
  let basePrice = 0;
  let reservePrice = 0;
  
  // Check for direct price fields
  if (data.price && typeof data.price === 'number' && data.price > 0) {
    basePrice = data.price;
  } else if (data.basePrice && typeof data.basePrice === 'number' && data.basePrice > 0) {
    basePrice = data.basePrice;
  } else if (data.marketValue && typeof data.marketValue === 'number' && data.marketValue > 0) {
    basePrice = data.marketValue;
  }
  
  // Check for Auto ISO API specific format
  if (data.price_min !== undefined && data.price_med !== undefined) {
    const min = Number(data.price_min);
    const med = Number(data.price_med);
    
    if (min > 0 && med > 0) {
      basePrice = (min + med) / 2;
    }
  }
  
  // Calculate reserve price (70-80% of base price)
  if (basePrice > 0) {
    reservePrice = Math.round(basePrice * 0.75);
  }
  
  // Set pricing fields explicitly
  enhanced.basePrice = basePrice;
  enhanced.reservePrice = reservePrice;
  enhanced.valuation = reservePrice;
  enhanced.averagePrice = basePrice;
  
  // Add debug information
  enhanced.debugInfo = {
    source: 'external_api',
    timestamp: new Date().toISOString(),
    pricingCalculated: basePrice > 0,
    originalPriceFields: Object.keys(data).filter(key => 
      key.toLowerCase().includes('price') || 
      key.toLowerCase().includes('value') ||
      key.toLowerCase().includes('valuation')
    )
  };
  
  return enhanced;
}
