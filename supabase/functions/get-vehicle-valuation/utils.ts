
/**
 * Utility functions for vehicle valuation
 * Updated: 2025-04-18 - Enhanced data extraction and validation
 */

import { crypto } from "https://deno.land/std@0.217.0/crypto/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { ValuationData } from "./types.ts";
import { logOperation } from "./logging.ts";

export function md5(message: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = crypto.subtle.digestSync("MD5", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const calculateValuationChecksum = (apiId: string, apiSecret: string, vin: string): string => {
  const checksumContent = apiId + apiSecret + vin;
  return md5(checksumContent);
};

export const getSupabaseClient = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  }
  
  return createClient(supabaseUrl, supabaseKey);
};

/**
 * Enhanced data extraction with robust property path support
 */
export function extractDataValue(data: any, propertyPaths: string[], defaultValue: any = null): any {
  // Try each property path in order
  for (const path of propertyPaths) {
    // Handle nested paths with dot notation
    const parts = path.split('.');
    let current = data;
    
    // Navigate through object following the path
    let valid = true;
    for (const part of parts) {
      if (current === null || current === undefined || typeof current !== 'object') {
        valid = false;
        break;
      }
      
      current = current[part];
      if (current === undefined) {
        valid = false;
        break;
      }
    }
    
    // If we successfully navigated the path and found a value
    if (valid && current !== undefined && current !== null) {
      // Convert to number if it looks numeric and we expect a number
      if (typeof current === 'string' && !isNaN(Number(current)) && 
          (typeof defaultValue === 'number' || defaultValue === 0)) {
        return Number(current);
      }
      return current;
    }
  }
  
  return defaultValue;
}

/**
 * Process and normalize raw valuation data
 */
export function processValuationData(rawData: any, vin: string, mileage: number, requestId: string): ValuationData {
  try {
    // Log the incoming data structure for debugging
    logOperation('processing_raw_valuation', { 
      requestId,
      dataKeys: Object.keys(rawData),
      hasUserParams: !!rawData.functionResponse?.userParams,
      hasCalcValuation: !!rawData.functionResponse?.valuation?.calcValuation
    });
    
    // Extract vehicle details with multiple fallback paths
    const make = extractDataValue(rawData, [
      'functionResponse.userParams.make', 
      'make', 
      'manufacturer', 
      'brand'
    ], '');
    
    const model = extractDataValue(rawData, [
      'functionResponse.userParams.model', 
      'model', 
      'modelName'
    ], '');
    
    const year = extractDataValue(rawData, [
      'functionResponse.userParams.year', 
      'year', 
      'productionYear'
    ], 0);
    
    // Extract pricing data with fallbacks
    const priceMin = extractDataValue(rawData, [
      'functionResponse.valuation.calcValuation.price_min',
      'price_min',
      'priceMin',
      'minPrice'
    ], 0);
    
    const priceMed = extractDataValue(rawData, [
      'functionResponse.valuation.calcValuation.price_med',
      'price_med',
      'priceMed',
      'medianPrice'
    ], 0);
    
    const price = extractDataValue(rawData, [
      'functionResponse.valuation.calcValuation.price',
      'price',
      'value',
      'estimatedValue'
    ], 0);
    
    // Calculate base price and reserve price
    let basePrice = 0;
    if (priceMin > 0 && priceMed > 0) {
      basePrice = (priceMin + priceMed) / 2;
    } else if (price > 0) {
      basePrice = price;
    }
    
    // Calculate reserve price using our shared formula
    const reservePrice = calculateReservePrice(basePrice);
    
    // Create standardized result object
    const result: ValuationData = {
      vin,
      make,
      model,
      year,
      mileage,
      price: basePrice,
      valuation: basePrice,
      reservePrice,
      averagePrice: priceMed || basePrice
    };
    
    // Validate essential data
    const isValid = make && model && year > 0 && basePrice > 0;
    
    // Log the processing result
    logOperation('valuation_data_processed', { 
      requestId,
      vin,
      isValid,
      make,
      model,
      year,
      basePrice,
      reservePrice
    });
    
    return result;
  } catch (error) {
    logOperation('data_processing_error', {
      requestId,
      error: error.message,
      stack: error.stack
    }, 'error');
    
    // Return minimal data with VIN
    return { vin, mileage };
  }
}

/**
 * Format the response for consistent API returns
 */
export const formatSuccessResponse = (data: any, status = 200) => {
  return new Response(
    JSON.stringify({
      success: true,
      data
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

export const formatErrorResponse = (error: string, status = 400, code = 'ERROR') => {
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

// CORS headers for HTTP responses
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Max-Age": "86400",
};

// Import and re-export the calculateReservePrice function
import { calculateReservePrice } from '../_shared/reserve-price.ts';
export { calculateReservePrice };
