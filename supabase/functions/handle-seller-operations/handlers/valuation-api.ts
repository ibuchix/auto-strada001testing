
/**
 * Changes made:
 * - 2024-07-22: Created dedicated module for API valuation service
 * - 2025-04-08: Enhanced data normalization and fallback values
 * - 2025-04-22: Fixed data structure consistency and reserve price calculation
 * - 2025-04-22: Fixed API response handling to preserve nested functionResponse
 * - 2025-04-26: Enhanced extraction of pricing data from functionResponse.valuation.calcValuation
 * - 2025-04-29: Added DEBUG logging to trace full API response preservation
 * - 2025-06-01: Improved error handling for missing pricing data and removed fallbacks
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { logOperation } from "../../_shared/index.ts";
import { generateChecksum } from "../checksum.ts";
import { OperationError } from "../error-handler.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const API_ID = Deno.env.get("CAR_API_ID") || "AUTOSTRA";
const API_SECRET = Deno.env.get("CAR_API_SECRET") || "";

/**
 * Call the vehicle valuation API
 */
export async function getValuationFromAPI(
  vin: string, 
  mileage: number, 
  gearbox: string, 
  requestId: string
) {
  try {
    // Generate checksum for API authentication
    const checksum = generateChecksum(API_ID, API_SECRET, vin);
    
    // Construct API URL
    const apiUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${API_ID}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/currency:PLN`;
    
    logOperation('api_request', { 
      requestId,
      url: apiUrl
    });
    
    // Call external API
    const response = await fetch(apiUrl);
    
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
        details: errorText
      };
    }
    
    // Parse the API response
    const apiData = await response.json();
    
    // DEBUG LOG FULL API RESPONSE
    logOperation('raw_api_response', {
      requestId,
      fullApiResponse: JSON.stringify(apiData)
    });
    
    logOperation('api_success', { 
      requestId, 
      responseSize: JSON.stringify(apiData).length,
      hasTopLevelFunctionResponse: !!apiData.functionResponse
    });
    
    // Log the top-level fields received from the API
    logOperation('api_fields_received', {
      requestId,
      fields: Object.keys(apiData),
      hasMake: !!apiData.make,
      hasModel: !!apiData.model,
      hasYear: !!apiData.productionYear || !!apiData.year,
      hasFunctionResponse: !!apiData.functionResponse
    });

    // Preserve the full functionResponse from API
    const functionResponse = apiData.functionResponse || {};
    
    // DEBUG: Log functionResponse structure
    logOperation('function_response_structure', {
      requestId,
      hasValuation: !!functionResponse.valuation,
      hasCalcValuation: !!functionResponse.valuation?.calcValuation,
      hasPriceMin: functionResponse.valuation?.calcValuation?.price_min !== undefined,
      valuationKeys: Object.keys(functionResponse.valuation || {}),
      calcValuationKeys: Object.keys(functionResponse.valuation?.calcValuation || {})
    });
    
    // Extract pricing data from calcValuation if available
    let priceMin = 0;
    let priceMed = 0;
    let basePrice = 0;

    // Try to extract from nested functionResponse first
    const calcValuation = functionResponse.valuation?.calcValuation;
    if (calcValuation && calcValuation.price_min !== undefined && calcValuation.price_med !== undefined) {
      priceMin = Number(calcValuation.price_min);
      priceMed = Number(calcValuation.price_med);
      
      // Calculate base price (average of min and median)
      basePrice = (priceMin + priceMed) / 2;
      
      logOperation('using_calcvaluation_prices', {
        requestId,
        priceMin,
        priceMed,
        basePrice
      });
    } else if (apiData.price_min !== undefined && apiData.price_med !== undefined) {
      // Fallback to top-level properties
      priceMin = Number(apiData.price_min);
      priceMed = Number(apiData.price_med);
      
      basePrice = (priceMin + priceMed) / 2;
      logOperation('using_root_prices', {
        requestId,
        priceMin,
        priceMed,
        basePrice
      });
    } else {
      // No valid pricing data found - throw error
      logOperation('missing_valid_pricing_data', {
        requestId,
        apiDataFields: Object.keys(apiData)
      }, 'error');
      
      return {
        success: false,
        error: "Could not extract price_min and price_med from API response",
        errorCode: "MISSING_PRICE_DATA"
      };
    }
    
    // Verify we have valid price data
    if (priceMin <= 0 || priceMed <= 0 || basePrice <= 0) {
      logOperation('invalid_price_values', {
        requestId,
        priceMin,
        priceMed,
        basePrice
      }, 'error');
      
      return {
        success: false,
        error: "Invalid price values in API response",
        errorCode: "INVALID_PRICE_DATA"
      };
    }
    
    // Calculate reserve price
    const reservePrice = calculateReservePrice(basePrice);
    
    if (reservePrice <= 0) {
      logOperation('invalid_reserve_price', {
        requestId,
        basePrice,
        reservePrice
      }, 'error');
      
      return {
        success: false,
        error: "Failed to calculate a valid reserve price",
        errorCode: "INVALID_RESERVE_PRICE"
      };
    }
    
    // Store in cache table for future reference
    const { error: cacheError } = await storeInCache(vin, mileage, {
      make: apiData.make,
      model: apiData.model,
      year: apiData.year || apiData.productionYear,
      price_min: priceMin,
      price_med: priceMed,
      basePrice,
      reservePrice
    });
    
    if (cacheError) {
      logOperation('cache_error', { 
        requestId, 
        error: cacheError.message 
      }, 'warn');
    }
    
    // Extract user params
    const userParams = functionResponse.userParams || {};
    
    // Get consistent field values with fallbacks
    const make = userParams.make || apiData.make || '';
    const model = userParams.model || apiData.model || '';
    const year = userParams.year || apiData.productionYear || apiData.year || 0;
    
    // CRITICAL: Log the final data structure being returned
    const returnData = {
      success: true,
      data: {
        vin,
        make,
        model,
        year,
        transmission: gearbox,
        mileage,
        price_min: priceMin,
        price_med: priceMed,
        basePrice,
        reservePrice,
        averagePrice: priceMed,
        valuation: basePrice,
        // Include the original functionResponse
        functionResponse
      }
    };
    
    logOperation('final_response_structure', {
      requestId,
      returnDataKeys: Object.keys(returnData),
      dataKeys: Object.keys(returnData.data),
      hasFunctionResponse: !!returnData.data.functionResponse,
      hasPriceData: priceMin > 0 && priceMed > 0,
      reservePrice: reservePrice
    });
    
    return returnData;
  } catch (error) {
    logOperation('api_exception', { 
      requestId, 
      error: error.message,
      stack: error.stack
    }, 'error');
    
    return {
      success: false,
      error: "Failed to get valuation: " + error.message
    };
  }
}

/**
 * Store valuation result in cache
 */
async function storeInCache(vin: string, mileage: number, valuationData: any) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  return await supabase.rpc('get_vin_valuation_cache', {
    p_vin: vin,
    p_mileage: mileage,
    p_valuation_data: valuationData
  });
}

/**
 * Calculate reserve price based on base price using the specified pricing tiers
 */
export function calculateReservePrice(basePrice: number): number {
  if (!basePrice || basePrice <= 0) {
    throw new OperationError("Invalid base price for reserve price calculation", "INVALID_BASE_PRICE");
  }
  
  // Determine the percentage based on price tier
  let percentage = 0;
  
  if (basePrice <= 15000) {
    percentage = 0.65;
  } else if (basePrice <= 20000) {
    percentage = 0.46;
  } else if (basePrice <= 30000) {
    percentage = 0.37;
  } else if (basePrice <= 50000) {
    percentage = 0.27;
  } else if (basePrice <= 60000) {
    percentage = 0.27;
  } else if (basePrice <= 70000) {
    percentage = 0.22;
  } else if (basePrice <= 80000) {
    percentage = 0.23;
  } else if (basePrice <= 100000) {
    percentage = 0.24;
  } else if (basePrice <= 130000) {
    percentage = 0.20;
  } else if (basePrice <= 160000) {
    percentage = 0.185;
  } else if (basePrice <= 200000) {
    percentage = 0.22;
  } else if (basePrice <= 250000) {
    percentage = 0.17;
  } else if (basePrice <= 300000) {
    percentage = 0.18;
  } else if (basePrice <= 400000) {
    percentage = 0.18;
  } else if (basePrice <= 500000) {
    percentage = 0.16;
  } else {
    percentage = 0.145; // 500,001+
  }
  
  // Calculate and round to the nearest whole number
  return Math.round(basePrice - (basePrice * percentage));
}
