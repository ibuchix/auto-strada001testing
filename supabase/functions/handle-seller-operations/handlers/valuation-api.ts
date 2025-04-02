
/**
 * Changes made:
 * - 2024-07-22: Created dedicated module for API valuation service
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
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
    
    // Store in cache table for future reference
    const { error: cacheError } = await storeInCache(vin, mileage, apiData);
    
    if (cacheError) {
      logOperation('cache_error', { 
        requestId, 
        error: cacheError.message 
      }, 'warn');
    }
    
    // Calculate base price (average of min and median prices from API)
    const priceMin = Number(apiData.price_min) || 0;
    const priceMed = Number(apiData.price_med) || 0;
    
    if (priceMin <= 0 || priceMed <= 0) {
      return {
        success: false,
        error: 'Could not retrieve valid pricing data for this vehicle'
      };
    }
    
    const basePrice = (priceMin + priceMed) / 2;
    
    // Calculate reserve price
    const reservePrice = calculateReservePrice(basePrice);
    
    // Format response
    return {
      success: true,
      data: {
        vin,
        make: apiData.make,
        model: apiData.model,
        year: apiData.productionYear,
        transmission: gearbox,
        mileage,
        price_min: apiData.priceMin,
        price_max: apiData.priceMax,
        price_med: apiData.priceMed,
        basePrice,
        reservePrice,
        valuationDetails: apiData
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
