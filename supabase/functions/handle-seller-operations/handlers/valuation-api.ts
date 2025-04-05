
/**
 * Changes made:
 * - 2024-07-22: Created dedicated module for API valuation service
 * - 2025-04-08: Enhanced data normalization and fallback values
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
    
    // Store in cache table for future reference
    const { error: cacheError } = await storeInCache(vin, mileage, apiData);
    
    if (cacheError) {
      logOperation('cache_error', { 
        requestId, 
        error: cacheError.message 
      }, 'warn');
    }
    
    // Get consistent field values with fallbacks
    const make = apiData.make || apiData.manufacturer || '';
    const model = apiData.model || apiData.modelName || '';
    const year = apiData.productionYear || apiData.year || 0;
    
    // Normalize price fields
    let priceMin = 0;
    let priceMed = 0;
    
    // Try to extract prices using different field names
    if (apiData.price_min !== undefined) priceMin = Number(apiData.price_min);
    else if (apiData.priceMin !== undefined) priceMin = Number(apiData.priceMin);
    else if (apiData.minPrice !== undefined) priceMin = Number(apiData.minPrice);
    else if (apiData.minimum_value !== undefined) priceMin = Number(apiData.minimum_value);
    else if (apiData.price !== undefined) priceMin = Number(apiData.price);
    
    if (apiData.price_med !== undefined) priceMed = Number(apiData.price_med);
    else if (apiData.priceMed !== undefined) priceMed = Number(apiData.priceMed);
    else if (apiData.medianPrice !== undefined) priceMed = Number(apiData.medianPrice);
    else if (apiData.median_value !== undefined) priceMed = Number(apiData.median_value);
    else if (apiData.average_value !== undefined) priceMed = Number(apiData.average_value);
    else if (apiData.price !== undefined) priceMed = Number(apiData.price);
    
    // If we don't have enough information, try to use any available price
    if (priceMin <= 0 && priceMed <= 0) {
      for (const [key, value] of Object.entries(apiData)) {
        if (
          (key.toLowerCase().includes('price') || 
          key.toLowerCase().includes('value')) && 
          !isNaN(Number(value)) && 
          Number(value) > 0
        ) {
          if (priceMin <= 0) priceMin = Number(value);
          if (priceMed <= 0) priceMed = Number(value);
          break;
        }
      }
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
    
    // Ensure we don't return undefined or null values
    const safeApiData = { ...apiData };
    
    // Format response
    return {
      success: true,
      data: {
        vin,
        make: make || '',
        model: model || '',
        year: year || new Date().getFullYear(),
        transmission: gearbox,
        mileage,
        price_min: priceMin,
        price_max: apiData.priceMax || apiData.price_max || 0,
        price_med: priceMed,
        basePrice,
        reservePrice,
        valuationDetails: safeApiData
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
