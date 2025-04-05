
/**
 * Edge function for getting vehicle valuations
 * This function calls the external valuation API and handles caching
 */

import { corsHeaders } from "../_shared/cors.ts";
import { logOperation } from "../_shared/logging.ts";
import { memoryCache } from "../_shared/cache.ts";
import { generateChecksum } from "../_shared/checksum.ts";
import { formatSuccessResponse, formatErrorResponse } from "../_shared/response-formatter.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { Database } from "../_shared/database.types.ts";

// Define API constants
const API_ID = Deno.env.get("CAR_API_ID") || "AUTOSTRA";
const API_SECRET = Deno.env.get("CAR_API_SECRET") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";

// Define the request handler
Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  // Get request ID for tracing
  const requestId = crypto.randomUUID();
  
  try {
    // Parse the request body
    const { vin, mileage, gearbox } = await req.json();
    
    // Validate required parameters
    if (!vin || !mileage) {
      return formatErrorResponse(
        "Missing required parameters: vin and mileage are required",
        400,
        "MISSING_PARAMETERS"
      );
    }
    
    // Log the valuation request
    logOperation('valuation_request', { 
      requestId, 
      vin, 
      mileage, 
      gearbox 
    });
    
    // Check cache first (using request ID for tracking)
    const cacheKey = `valuation:${vin}:${mileage}`;
    const cachedResult = memoryCache.get(cacheKey);
    
    if (cachedResult) {
      logOperation('valuation_cache_hit', { 
        requestId, 
        vin, 
        cacheKey 
      });
      return formatSuccessResponse(cachedResult);
    }
    
    // Get valuation from external API
    const valuationResult = await fetchExternalValuation(vin, mileage, requestId);
    
    if (!valuationResult.success) {
      return formatErrorResponse(
        valuationResult.error || "Failed to retrieve valuation",
        400,
        valuationResult.errorCode
      );
    }
    
    // Get a Supabase client for database operations
    const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Calculate base price (average of min and median prices)
    const priceMin = Number(valuationResult.data.price_min) || 0;
    const priceMed = Number(valuationResult.data.price_med) || 0;
    const basePrice = (priceMin + priceMed) / 2;
    
    // Calculate reserve price
    const reservePrice = calculateReservePrice(basePrice, requestId);
    
    // Prepare the final response data
    const responseData = {
      success: true,
      data: {
        make: valuationResult.data.make,
        model: valuationResult.data.model,
        year: valuationResult.data.year,
        transmission: gearbox,
        mileage: mileage,
        basePrice: basePrice,
        reservePrice: reservePrice,
        valuation: valuationResult.data
      }
    };
    
    // Store in cache
    memoryCache.set(cacheKey, responseData);
    
    // Also store in database cache
    try {
      const { error: cacheError } = await supabase.rpc(
        'store_vin_valuation_cache',
        { 
          p_vin: vin,
          p_mileage: mileage,
          p_valuation_data: responseData.data
        }
      );
      
      if (cacheError) {
        logOperation('db_cache_error', { 
          requestId, 
          vin, 
          error: cacheError.message 
        }, 'warn');
      }
    } catch (dbError) {
      logOperation('db_cache_exception', { 
        requestId, 
        vin, 
        error: dbError.message 
      }, 'warn');
    }
    
    // Return success response
    logOperation('valuation_success', { 
      requestId, 
      vin, 
      dataSize: JSON.stringify(responseData).length
    });
    
    return formatSuccessResponse(responseData.data);
    
  } catch (err) {
    // Log error and return formatted response
    logOperation('valuation_error', { 
      requestId, 
      error: err.message,
      stack: err.stack
    }, 'error');
    
    return formatErrorResponse(
      `Error processing valuation request: ${err.message}`,
      500,
      "INTERNAL_ERROR"
    );
  }
});

/**
 * Fetch valuation data from the external API
 */
async function fetchExternalValuation(vin: string, mileage: number, requestId: string) {
  try {
    // Generate checksum for API authentication
    const checksum = generateChecksum(API_ID, API_SECRET, vin);
    
    // Construct API URL
    const apiUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${API_ID}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/currency:PLN`;
    
    logOperation('api_request', { 
      requestId,
      url: apiUrl
    });
    
    // Call external API with retry
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      logOperation('api_error', { 
        requestId, 
        status: response.status,
        error: errorText
      }, 'error');
      
      return {
        success: false,
        error: `API returned error status: ${response.status}`,
        errorCode: "API_ERROR",
        details: errorText
      };
    }
    
    const apiData = await response.json();
    
    logOperation('api_success', { 
      requestId, 
      responseSize: JSON.stringify(apiData).length
    });
    
    // Extract and validate the essential data
    if (!apiData.make || !apiData.model) {
      return {
        success: false,
        error: "Missing essential vehicle data in API response",
        errorCode: "VALIDATION_ERROR"
      };
    }
    
    return {
      success: true,
      data: apiData
    };
    
  } catch (error) {
    logOperation('api_exception', { 
      requestId, 
      error: error.message,
      stack: error.stack
    }, 'error');
    
    return {
      success: false,
      error: "Failed to get valuation: " + error.message,
      errorCode: "API_EXCEPTION"
    };
  }
}

/**
 * Calculate the reserve price based on the base price and pricing tiers
 */
function calculateReservePrice(basePrice: number, requestId: string): number {
  // Log the calculation request
  logOperation('calculate_reserve_price', { 
    requestId, 
    basePrice
  });
  
  // Determine percentage reduction based on price tier
  let percentageReduction = 0;
  
  if (basePrice <= 15000) {
    percentageReduction = 0.65;  // 65%
  } else if (basePrice <= 20000) {
    percentageReduction = 0.46;  // 46%
  } else if (basePrice <= 30000) {
    percentageReduction = 0.37;  // 37%
  } else if (basePrice <= 50000) {
    percentageReduction = 0.27;  // 27%
  } else if (basePrice <= 60000) {
    percentageReduction = 0.27;  // 27%
  } else if (basePrice <= 70000) {
    percentageReduction = 0.22;  // 22%
  } else if (basePrice <= 80000) {
    percentageReduction = 0.23;  // 23%
  } else if (basePrice <= 100000) {
    percentageReduction = 0.24;  // 24%
  } else if (basePrice <= 130000) {
    percentageReduction = 0.20;  // 20%
  } else if (basePrice <= 160000) {
    percentageReduction = 0.185; // 18.5%
  } else if (basePrice <= 200000) {
    percentageReduction = 0.22;  // 22%
  } else if (basePrice <= 250000) {
    percentageReduction = 0.17;  // 17%
  } else if (basePrice <= 300000) {
    percentageReduction = 0.18;  // 18%
  } else if (basePrice <= 400000) {
    percentageReduction = 0.18;  // 18%
  } else if (basePrice <= 500000) {
    percentageReduction = 0.16;  // 16%
  } else {
    percentageReduction = 0.145; // 14.5%
  }
  
  // Calculate reserve price: basePrice - (basePrice * percentageReduction)
  const reservePrice = Math.round(basePrice * (1 - percentageReduction));
  
  // Log result for traceability
  logOperation('reserve_price_calculated', { 
    requestId, 
    basePrice,
    percentageReduction,
    reservePrice
  });
  
  return reservePrice;
}
