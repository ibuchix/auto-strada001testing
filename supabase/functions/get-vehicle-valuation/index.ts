
/**
 * Updated edge function for vehicle valuation with nested JSON support
 * This file handles the VIN validation and valuation API call with proper handling of nested JSON responses
 * Updated: 2025-04-28 - Improved VIN validation to be more flexible
 * Updated: 2025-04-29 - Fixed request method handling to process both GET and POST
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
    // Extract parameters - handle both POST body and URL query params
    let vin, mileage, gearbox;
    
    // Log received request for debugging
    logOperation('request_received', {
      method: req.method,
      url: req.url,
      contentType: req.headers.get('content-type')
    });
    
    if (req.method === "POST") {
      try {
        // Parse request body for POST
        const body = await req.json();
        vin = body.vin;
        mileage = body.mileage || 0;
        gearbox = body.gearbox || 'manual';
        
        logOperation('post_body_parsed', {
          vin,
          mileage,
          gearbox
        });
      } catch (e) {
        logOperation('post_body_parse_error', { 
          error: e.message 
        }, 'error');
        return formatErrorResponse("Invalid JSON in request body", 400);
      }
    } else {
      // Handle GET request with URL parameters
      const url = new URL(req.url);
      vin = url.searchParams.get("vin");
      mileage = url.searchParams.get("mileage") || "0";
      gearbox = url.searchParams.get("gearbox") || "manual";
      
      logOperation('url_params_parsed', {
        vin,
        mileage,
        gearbox
      });
    }

    // More flexible VIN validation
    if (!vin) {
      return formatErrorResponse("Missing VIN parameter", 400, "MISSING_VIN");
    }

    // Sanitize the VIN (remove whitespace, special characters)
    vin = vin.toString().trim().replace(/[^A-Z0-9]/gi, '');

    // Log the sanitized VIN
    logOperation('sanitized_vin', { vin, vinLength: vin.length });

    // Check if VIN is still valid after sanitization
    if (vin.length < 5) {  // Most VINs are 17 chars, but some older ones might be shorter
      return formatErrorResponse("VIN too short after sanitization", 400, "INVALID_VIN");
    }

    // Convert mileage to number
    const mileageNumber = typeof mileage === 'string' ? parseInt(mileage, 10) : Number(mileage);
    if (isNaN(mileageNumber)) {
      return formatErrorResponse("Invalid mileage value", 400, "INVALID_MILEAGE");
    }

    // Check cache first
    const { data: cacheData, error: cacheError } = await supabase
      .from('vin_valuation_cache')
      .select('*')
      .eq('vin', vin)
      .eq('mileage', mileageNumber)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cacheData && !cacheError) {
      logOperation('cache_hit', {
        vin,
        mileage: mileageNumber
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
    const apiUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${API_ID}/checksum:${checksum}/vin:${vin}/odometer:${mileageNumber}/currency:PLN`;

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
      responseStatus: response.status,
      rawResponse: responseText.substring(0, 200) + '...'
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
    if (valuationData.apiStatus && valuationData.apiStatus !== "OK") {
      logOperation('api_error', {
        status: valuationData.apiStatus
      }, 'error');
      return formatErrorResponse(`API Error: ${valuationData.apiStatus}`, 400, "API_ERROR");
    }

    // Process and enhance the data
    const enhancedValuationData = normalizeValuationData(valuationData, vin, mileageNumber);

    // Store in cache
    try {
      const { error: insertError } = await supabase
        .from('vin_valuation_cache')
        .insert({
          vin,
          mileage: mileageNumber,
          valuation_data: enhancedValuationData,
          created_at: new Date().toISOString()
        });

      if (insertError) {
        logOperation('cache_insert_error', {
          error: insertError.message
        }, 'error');
      }
    } catch (cacheError) {
      logOperation('cache_insert_exception', {
        error: cacheError.message
      }, 'error');
      // Continue even if caching fails
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
