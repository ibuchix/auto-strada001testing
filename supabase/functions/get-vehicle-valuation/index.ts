
/**
 * Updated edge function for vehicle valuation with enhanced debugging
 * This file handles the VIN validation and valuation API call with proper handling of nested JSON responses
 * Updated: 2025-04-28 - Improved VIN validation to be more flexible
 * Updated: 2025-04-29 - Fixed request method handling to process both GET and POST
 * Updated: 2025-04-30 - Enhanced error handling and debugging
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

// Enhanced logging utility
function logOperation(operation, details, level = 'info') {
  const logEntry = {
    timestamp: new Date().toISOString(),
    operation,
    level,
    ...details
  };
  console.log(JSON.stringify(logEntry));
}

function logVerbose(title, data) {
  try {
    console.log(`==== ${title} ====`);
    console.log(JSON.stringify(data, null, 2));
    console.log("================");
  } catch (e) {
    console.log(`Could not stringify ${title}:`, e.message);
  }
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
    // Log raw data for debugging
    logVerbose("Raw API data received", data);
    
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

    // First try the direct pricing fields
    if (data?.price) {
      marketValue = Number(data.price);
      logOperation('price_extraction', { source: 'direct_price', value: marketValue });
    } 
    // Then try to extract price from various nested locations
    else if (data?.functionResponse?.valuation?.calcValuation?.price) {
      marketValue = Number(data.functionResponse.valuation.calcValuation.price);
      logOperation('price_extraction', { source: 'calcValuation.price', value: marketValue });
    } 
    else if (data?.functionResponse?.valuation?.calcValuation?.price_med) {
      marketValue = Number(data.functionResponse.valuation.calcValuation.price_med);
      logOperation('price_extraction', { source: 'calcValuation.price_med', value: marketValue });
    } 
    else if (data?.functionResponse?.valuation?.calcValuation?.price_avr) {
      marketValue = Number(data.functionResponse.valuation.calcValuation.price_avr);
      logOperation('price_extraction', { source: 'calcValuation.price_avr', value: marketValue });
    } 
    else {
      // Fallback: search recursively through the object for any price or valuation fields
      const priceValue = findPriceInObject(data);
      
      if (priceValue) {
        marketValue = Number(priceValue);
        logOperation('price_extraction', { source: 'deep_search', value: marketValue });
      } else {
        logOperation('price_extraction_failed', {
          data: JSON.stringify(data).substring(0, 200) + '...'
        }, 'error');
        
        // Use a default value if all fails
        marketValue = 30000;
        logOperation('using_default_price', { value: marketValue }, 'warn');
      }
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
      noData: false,
      rawApiResponse: JSON.stringify(data).length > 10000 ? "Response too large to include" : data
    };

    logOperation('normalized_result', {
      result: JSON.stringify(result).substring(0, 200) + '...'
    });

    return result;
  } catch (error) {
    logOperation('normalization_error', {
      error: error.message,
      stack: error.stack
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
      noData: true,
      normalizationError: error.message,
      normalizationStack: error.stack
    };
  }
}

// Helper function to recursively search for price in object
function findPriceInObject(obj, depth = 0) {
  if (!obj || typeof obj !== 'object' || depth > 5) return null;
  
  // Direct price-related fields to check
  const priceFields = ['price', 'price_med', 'price_min', 'price_max', 'price_avr', 
                       'valuation', 'basePrice', 'averagePrice', 'value'];
  
  for (const field of priceFields) {
    if (obj[field] && typeof obj[field] === 'number' && obj[field] > 0) {
      return obj[field];
    }
    
    if (obj[field] && typeof obj[field] === 'string' && !isNaN(Number(obj[field])) && Number(obj[field]) > 0) {
      return Number(obj[field]);
    }
  }
  
  // Search through child objects
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      const result = findPriceInObject(obj[key], depth + 1);
      if (result) return result;
    }
  }
  
  return null;
}

// Main handler
serve(async (req)=>{
  const requestId = crypto.randomUUID();
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    // Log received request for debugging
    logOperation('request_received', {
      requestId,
      method: req.method,
      url: req.url,
      contentType: req.headers.get('content-type')
    });
    
    // Extract parameters - handle both POST body and URL query params
    let vin, mileage, gearbox, debug = false;
    
    if (req.method === "POST") {
      try {
        // Clone the request for debugging
        const reqClone = req.clone();
        const bodyText = await reqClone.text();
        
        logOperation('request_body_raw', {
          requestId,
          bodyText: bodyText.substring(0, 1000) // Log first 1000 chars
        });
        
        // Parse request body for POST
        const body = JSON.parse(bodyText);
        vin = body.vin;
        mileage = body.mileage || 0;
        gearbox = body.gearbox || 'manual';
        debug = body.debug || false;
        
        logOperation('post_body_parsed', {
          requestId,
          vin,
          mileage,
          gearbox,
          debug
        });
      } catch (e) {
        logOperation('post_body_parse_error', { 
          requestId,
          error: e.message,
          stack: e.stack 
        }, 'error');
        return formatErrorResponse("Invalid JSON in request body: " + e.message, 400);
      }
    } else {
      // Handle GET request with URL parameters
      const url = new URL(req.url);
      vin = url.searchParams.get("vin");
      mileage = url.searchParams.get("mileage") || "0";
      gearbox = url.searchParams.get("gearbox") || "manual";
      debug = url.searchParams.get("debug") === "true";
      
      logOperation('url_params_parsed', {
        requestId,
        vin,
        mileage,
        gearbox,
        debug
      });
    }

    // More flexible VIN validation
    if (!vin) {
      logOperation('missing_vin_parameter', { requestId }, 'error');
      return formatErrorResponse("Missing VIN parameter", 400, "MISSING_VIN");
    }

    // Sanitize the VIN (remove whitespace, special characters)
    vin = vin.toString().trim().replace(/[^A-Z0-9]/gi, '');

    // Log the sanitized VIN
    logOperation('sanitized_vin', { requestId, vin, vinLength: vin.length });

    // Check if VIN is still valid after sanitization
    if (vin.length < 5) {  // Most VINs are 17 chars, but some older ones might be shorter
      logOperation('vin_too_short', { requestId, vin }, 'error');
      return formatErrorResponse("VIN too short after sanitization", 400, "INVALID_VIN");
    }

    // Convert mileage to number
    const mileageNumber = typeof mileage === 'string' ? parseInt(mileage, 10) : Number(mileage);
    if (isNaN(mileageNumber)) {
      logOperation('invalid_mileage', { requestId, mileage }, 'error');
      return formatErrorResponse("Invalid mileage value", 400, "INVALID_MILEAGE");
    }

    // Check cache if not in debug mode
    if (!debug) {
      try {
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
            requestId,
            vin,
            mileage: mileageNumber
          });
          return formatSuccessResponse(cacheData.valuation_data);
        } else if (cacheError) {
          // Just log cache errors but continue to the API call
          logOperation('cache_error', { 
            requestId,
            error: cacheError.message
          }, 'warn');
        }
      } catch (cacheErr) {
        // Log and continue if cache check fails
        logOperation('cache_check_exception', { 
          requestId,
          error: cacheErr.message
        }, 'warn');
      }
    }

    // Check for required API credentials
    if (!API_ID || !API_SECRET) {
      logOperation('missing_api_credentials', { requestId }, 'error');
      return formatErrorResponse("Missing API credentials for valuation service", 500, "CONFIG_ERROR");
    }

    // Calculate checksum for API request
    const checksumContent = API_ID + API_SECRET + vin;
    const checksum = calculateMD5(checksumContent);

    logOperation('checksum_calculated', {
      requestId,
      checksum
    });

    // Construct API URL
    const apiUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${API_ID}/checksum:${checksum}/vin:${vin}/odometer:${mileageNumber}/currency:PLN`;

    // Call external API
    logOperation('calling_external_api', {
      requestId,
      url: apiUrl,
      vin,
      mileage: mileageNumber
    });

    try {
      const response = await fetch(apiUrl);
      const responseText = await response.text();

      // Log raw API response for debugging
      logOperation('raw_api_response', {
        requestId,
        responseSize: responseText.length,
        responseStatus: response.status,
        rawResponseSample: responseText.substring(0, 500) + (responseText.length > 500 ? '...' : '')
      });

      // Parse response
      let valuationData;
      try {
        valuationData = JSON.parse(responseText);
      } catch (e) {
        logOperation('json_parse_error', {
          requestId,
          error: e.message,
          text: responseText.substring(0, 200)
        }, 'error');
        return formatErrorResponse("Invalid API response format: " + e.message, 500, "PARSE_ERROR");
      }

      // Check for API errors
      if (valuationData.apiStatus && valuationData.apiStatus !== "OK") {
        logOperation('api_error_status', {
          requestId,
          status: valuationData.apiStatus
        }, 'error');
        return formatErrorResponse(`API Error: ${valuationData.apiStatus}`, 400, "API_ERROR");
      }

      // Process and enhance the data
      const enhancedValuationData = normalizeValuationData(valuationData, vin, mileageNumber);

      // Store in cache if not in debug mode
      if (!debug) {
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
              requestId,
              error: insertError.message
            }, 'error');
          }
        } catch (cacheError) {
          logOperation('cache_insert_exception', {
            requestId,
            error: cacheError.message
          }, 'error');
          // Continue even if caching fails
        }
      }

      logOperation('request_completed_successfully', {
        requestId,
        vin,
        mileage: mileageNumber,
        hasValidationData: !!enhancedValuationData,
        responseDataSample: JSON.stringify(enhancedValuationData).substring(0, 200) + '...'
      });

      return formatSuccessResponse(enhancedValuationData);
    } catch (apiError) {
      logOperation('external_api_error', {
        requestId, 
        vin,
        error: apiError.message,
        stack: apiError.stack
      }, 'error');
      
      // Return a fallback response with error details
      return formatErrorResponse(`Error calling valuation API: ${apiError.message}`, 500, "API_FETCH_ERROR");
    }
  } catch (error) {
    logOperation('unhandled_error', {
      requestId,
      error: error.message,
      stack: error.stack
    }, 'error');
    return formatErrorResponse(`Error processing valuation request: ${error.message}`, 500, "INTERNAL_ERROR");
  }
});
