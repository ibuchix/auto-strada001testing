
/**
 * Updated edge function for vehicle valuation with nested JSON support
 * This file handles the VIN validation and valuation API call with proper handling of nested JSON responses
 * Updated: 2025-04-28 - Improved VIN validation to be more flexible
 */

import { serve } from "https://deno.land/std@0.217.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { crypto } from "https://deno.land/std@0.217.0/crypto/mod.ts";

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// API credentials
const API_ID = Deno.env.get("VALUATION_API_ID") || "";
const API_SECRET = Deno.env.get("VALUATION_API_SECRET") || "";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
};

// Response formatting utilities
function formatSuccessResponse(data) {
  return new Response(JSON.stringify({
    success: true,
    data
  }), {
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}

function formatErrorResponse(error, status = 400, code = 'ERROR') {
  return new Response(JSON.stringify({
    success: false,
    error,
    code
  }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}

// Logging utility
function logOperation(operation, details, level = 'info') {
  const logEntry = {
    timestamp: new Date().toISOString(),
    operation,
    level,
    ...details
  };
  console.log(JSON.stringify(logEntry));
}

// Calculate MD5 hash
function calculateMD5(message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = crypto.subtle.digestSync("MD5", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b)=>b.toString(16).padStart(2, '0')).join('');
}

// Normalize valuation data from nested API response
function normalizeValuationData(data, vin, mileage) {
  logOperation('normalizing_valuation_data', {
    vin,
    mileage
  });

  try {
    // Extract vehicle details from nested structure
    const vehicleDetails = {
      make: data?.functionResponse?.userParams?.make || '',
      model: data?.functionResponse?.userParams?.model || '',
      year: Number(data?.functionResponse?.userParams?.year) || 0,
      vin: data?.vin || vin,
      transmission: data?.functionResponse?.userParams?.gearbox || 'manual',
      mileage: Number(data?.functionResponse?.userParams?.odometer) || mileage,
      fuel: data?.functionResponse?.userParams?.fuel || '',
      capacity: data?.functionResponse?.userParams?.capacity || ''
    };

    // Extract price from nested structure
    let marketValue = null;

    // Try to extract price from various nested locations
    if (data?.functionResponse?.valuation?.calcValuation?.price) {
      marketValue = Number(data.functionResponse.valuation.calcValuation.price);
      logOperation('price_extraction', {
        source: 'calcValuation.price',
        value: marketValue
      });
    } else if (data?.functionResponse?.valuation?.calcValuation?.price_med) {
      marketValue = Number(data.functionResponse.valuation.calcValuation.price_med);
      logOperation('price_extraction', {
        source: 'calcValuation.price_med',
        value: marketValue
      });
    } else if (data?.functionResponse?.valuation?.calcValuation?.price_avr) {
      marketValue = Number(data.functionResponse.valuation.calcValuation.price_avr);
      logOperation('price_extraction', {
        source: 'calcValuation.price_avr',
        value: marketValue
      });
    } else {
      logOperation('price_extraction_failed', {
        data: JSON.stringify(data).substring(0, 200) + '...'
      }, 'error');
      return {
        error: 'No valid price found in response',
        noData: true
      };
    }

    // Calculate reserve price (75% of market value)
    const reservePrice = Math.round(marketValue * 0.75);
    
    // Get average price from nested structure or use market value
    const averagePrice = data?.functionResponse?.valuation?.calcValuation?.price_avr || marketValue;

    // Construct normalized result
    const result = {
      ...vehicleDetails,
      valuation: marketValue,
      reservePrice: reservePrice,
      averagePrice: Number(averagePrice),
      basePrice: marketValue,
      apiSource: 'autoiso_v3',
      error: null,
      noData: false
    };

    logOperation('normalized_result', {
      result: JSON.stringify(result).substring(0, 200) + '...'
    });

    return result;
  } catch (error) {
    logOperation('normalization_error', {
      error: error.message
    }, 'error');

    // Return error result with fallback values
    return {
      make: '',
      model: '',
      year: 0,
      vin: vin,
      transmission: 'manual',
      mileage: mileage,
      valuation: 0,
      reservePrice: 0,
      averagePrice: 0,
      basePrice: 0,
      apiSource: 'error',
      error: error.message,
      noData: true
    };
  }
}

// Main handler
serve(async (req)=>{
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    const url = new URL(req.url);
    let vin = url.searchParams.get("vin");
    const mileage = url.searchParams.get("mileage") || "0";

    logOperation('request_received', {
      vin,
      mileage
    });

    // More flexible VIN validation
    if (!vin) {
      return formatErrorResponse("Missing VIN parameter", 400, "MISSING_VIN");
    }

    // Sanitize the VIN (remove whitespace, special characters)
    vin = vin.toString().trim().replace(/[^A-Z0-9]/gi, '');

    // Log the sanitized VIN
    logOperation('sanitized_vin', { vin, vinLength: vin.length });

    // Check if VIN is still valid after sanitization
    if (vin.length < 10) {  // Most VINs are 17 chars, but some older ones might be shorter
      return formatErrorResponse("VIN too short after sanitization", 400, "INVALID_VIN");
    }

    // Check cache first
    const { data: cacheData, error: cacheError } = await supabase
      .from('vin_valuation_cache')
      .select('*')
      .eq('vin', vin)
      .eq('mileage', Number(mileage))
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cacheData && !cacheError) {
      logOperation('cache_hit', {
        vin,
        mileage
      });
      return formatSuccessResponse(cacheData.valuation_data);
    }

    // Calculate checksum for API request
    const checksumContent = API_ID + API_SECRET + vin;
    const checksum = calculateMD5(checksumContent);

    logOperation('checksum_calculated', {
      checksum
    });

    // Construct API URL
    const apiUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${API_ID}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/currency:PLN`;

    // Call external API
    logOperation('calling_external_api', {
      url: apiUrl
    });

    const response = await fetch(apiUrl);
    const responseText = await response.text();

    // Log raw API response for debugging
    logOperation('raw_api_response', {
      requestId: crypto.randomUUID(),
      responseSize: responseText.length,
      rawResponse: responseText
    });

    // Parse response
    let valuationData;
    try {
      valuationData = JSON.parse(responseText);
    } catch (e) {
      logOperation('json_parse_error', {
        error: e.message,
        text: responseText.substring(0, 200)
      }, 'error');
      return formatErrorResponse("Invalid API response", 500, "PARSE_ERROR");
    }

    // Check for API errors
    if (valuationData.apiStatus !== "OK") {
      logOperation('api_error', {
        status: valuationData.apiStatus
      }, 'error');
      return formatErrorResponse(`API Error: ${valuationData.apiStatus}`, 400, "API_ERROR");
    }

    // Process and enhance the data
    const enhancedValuationData = normalizeValuationData(valuationData, vin, Number(mileage));

    // Store in cache
    const { error: insertError } = await supabase
      .from('vin_valuation_cache')
      .insert({
        vin,
        mileage: Number(mileage),
        valuation_data: enhancedValuationData,
        created_at: new Date().toISOString()
      });

    if (insertError) {
      logOperation('cache_insert_error', {
        error: insertError.message
      }, 'error');
    }

    return formatSuccessResponse(enhancedValuationData);
  } catch (error) {
    logOperation('unhandled_error', {
      error: error.message,
      stack: error.stack
    }, 'error');
    return formatErrorResponse(`Error processing request: ${error.message}`, 500, "INTERNAL_ERROR");
  }
});
