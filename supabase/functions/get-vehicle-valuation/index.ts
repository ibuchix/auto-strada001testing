/**
 * Vehicle Valuation Edge Function
 * Updated: 2025-04-20 - Fixed MD5 implementation and improved error handling
 * Updated: 2025-04-21 - Updated data processing to handle nested Auto ISO API response structure
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

// ADDED: Function to enhance valuation data with pricing information
function enhanceValuationData(data: any, vin: string, mileage: number): any {
  // Extract pricing data from the correct nested path in the Auto ISO API response
  let basePrice = 0;
  let priceMin = 0;
  let priceMed = 0;
  let priceMax = 0;
  
  // Extract data from the proper nested structure
  if (data.functionResponse?.valuation?.calcValuation) {
    const calcValuation = data.functionResponse.valuation.calcValuation;
    priceMin = calcValuation.price_min || 0;
    priceMed = calcValuation.price_med || 0;
    priceMax = calcValuation.price_max || 0;
    
    // Use price or calculate basePrice
    basePrice = calcValuation.price || ((priceMin + priceMed) / 2);
  }
  
  // Calculate reserve price based on the extracted base price
  let reservePrice = calculateReservePrice(basePrice);
  
  // Extract vehicle details from the API response
  const userParams = data.functionResponse?.userParams || {};
  const make = userParams.make || '';
  const model = userParams.model || '';
  const year = userParams.year || 0;
  
  // Create an enhanced data object with all necessary fields
  const enhancedData = {
    ...data, // Keep the original data
    // Add normalized fields at the root level for easier access
    make: make,
    model: model,
    year: year,
    vin: vin,
    mileage: mileage,
    basePrice: basePrice,
    reservePrice: reservePrice,
    valuation: basePrice,
    averagePrice: priceMed,
    price_min: priceMin,
    price_med: priceMed,
    price_max: priceMax,
    // Add debug information to help troubleshoot
    debugInfo: {
      extractionTime: new Date().toISOString(),
      hasNestedPricing: !!data.functionResponse?.valuation?.calcValuation,
      calculatedReservePrice: !!reservePrice
    }
  };
  
  return enhancedData;
}

// Helper function to calculate reserve price
function calculateReservePrice(basePrice: number): number {
  if (!basePrice || isNaN(basePrice) || basePrice <= 0) {
    return 0;
  }
  
  // Determine the percentage based on price tier
  let percentage = 0;
  
  if (basePrice <= 15000) percentage = 0.65;
  else if (basePrice <= 20000) percentage = 0.46;
  else if (basePrice <= 30000) percentage = 0.37;
  else if (basePrice <= 50000) percentage = 0.27;
  else if (basePrice <= 60000) percentage = 0.27;
  else if (basePrice <= 70000) percentage = 0.22;
  else if (basePrice <= 80000) percentage = 0.23;
  else if (basePrice <= 100000) percentage = 0.24;
  else if (basePrice <= 130000) percentage = 0.20;
  else if (basePrice <= 160000) percentage = 0.185;
  else if (basePrice <= 200000) percentage = 0.22;
  else if (basePrice <= 250000) percentage = 0.17;
  else if (basePrice <= 300000) percentage = 0.18;
  else if (basePrice <= 400000) percentage = 0.18;
  else if (basePrice <= 500000) percentage = 0.16;
  else percentage = 0.145;
  
  // Calculate and round to the nearest whole number
  return Math.round(basePrice - (basePrice * percentage));
}

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

    // ADDED: Enhance the valuation data processing with the actual structure
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
