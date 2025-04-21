
/**
 * Changes made:
 * - 2024-07-22: Created dedicated module for API valuation service
 * - 2025-04-08: Enhanced data normalization and fallback values
 * - 2025-04-22: Fixed data structure consistency and reserve price calculation
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { logOperation } from "../../_shared/index.ts";
import { generateChecksum } from "../checksum.ts";

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
    
    const apiData = await response.json();
    logOperation('api_success', { 
      requestId, 
      responseSize: JSON.stringify(apiData).length
    });
    
    // Log the fields received from the API
    logOperation('api_fields_received', {
      requestId,
      fields: Object.keys(apiData),
      hasMake: !!apiData.make,
      hasModel: !!apiData.model,
      hasYear: !!apiData.productionYear || !!apiData.year
    });

    // Extract data from the response structure
    // The Auto ISO API returns data in a nested structure under functionResponse
    const functionResponse = apiData.functionResponse || {};
    const userParams = functionResponse.userParams || {};
    const calcValuation = functionResponse.valuation?.calcValuation || {};
    
    // Get consistent field values with fallbacks
    const make = userParams.make || apiData.make || '';
    const model = userParams.model || apiData.model || '';
    const year = userParams.year || apiData.productionYear || apiData.year || 0;
    
    // Normalize price fields with enhanced extraction
    let priceMin = 0;
    let priceMed = 0;
    
    // First try to get prices from nested calcValuation (preferred source)
    if (calcValuation.price_min !== undefined) priceMin = Number(calcValuation.price_min);
    if (calcValuation.price_med !== undefined) priceMed = Number(calcValuation.price_med);
    
    // If not found in calcValuation, try root level
    if (priceMin <= 0 && apiData.price_min !== undefined) priceMin = Number(apiData.price_min);
    if (priceMed <= 0 && apiData.price_med !== undefined) priceMed = Number(apiData.price_med);
    
    // If still no valid prices, try alternative field names
    if (priceMin <= 0) {
      if (apiData.priceMin !== undefined) priceMin = Number(apiData.priceMin);
      else if (apiData.minPrice !== undefined) priceMin = Number(apiData.minPrice);
      else if (apiData.minimum_value !== undefined) priceMin = Number(apiData.minimum_value);
      else if (apiData.price !== undefined) priceMin = Number(apiData.price);
    }
    
    if (priceMed <= 0) {
      if (apiData.priceMed !== undefined) priceMed = Number(apiData.priceMed);
      else if (apiData.medianPrice !== undefined) priceMed = Number(apiData.medianPrice);
      else if (apiData.median_value !== undefined) priceMed = Number(apiData.median_value);
      else if (apiData.average_value !== undefined) priceMed = Number(apiData.average_value);
      else if (apiData.price !== undefined) priceMed = Number(apiData.price);
    }
    
    // Check if we have critical data
    const hasCriticalData = make && model && year > 0;
    
    // We need at least some pricing data to continue
    if ((priceMin <= 0 || priceMed <= 0) && !hasCriticalData) {
      logOperation('insufficient_pricing_data', { 
        requestId, 
        vin,
        priceMin,
        priceMed,
        hasMake: !!make,
        hasModel: !!model,
        hasYear: year > 0
      }, 'error');
      
      // If we have make/model/year, but no pricing, we can still return
      if (hasCriticalData) {
        // Use sensible defaults for price
        priceMin = 30000;
        priceMed = 30000;
        
        logOperation('using_default_pricing', {
          requestId,
          vin,
          make,
          model,
          year
        }, 'warn');
      } else {
        return {
          success: false,
          error: 'Could not retrieve valid pricing data for this vehicle'
        };
      }
    }
    
    // Calculate base price (average of min and median prices)
    const basePrice = (priceMin + priceMed) / 2;
    
    // Calculate reserve price
    const reservePrice = calculateReservePrice(basePrice);
    
    // Store in cache table for future reference
    const { error: cacheError } = await storeInCache(vin, mileage, {
      make,
      model,
      year,
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
    
    // Format response to match the structure expected by frontend
    return {
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
        // Include the original response to aid debugging
        functionResponse: {
          userParams: {
            make,
            model,
            year
          },
          valuation: {
            calcValuation: {
              price_min: priceMin,
              price_med: priceMed
            }
          }
        }
      }
    };
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
 * Calculate reserve price based on base price
 */
export function calculateReservePrice(basePrice: number): number {
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
