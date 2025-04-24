// This file contains service functions for fetching vehicle valuations
// Updated: 2025-04-24 - Removed all caching functionality

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";
import { logOperation } from './utils/logging.ts';

export interface ValuationResult {
  success: boolean;
  data?: any;
  error?: string;
  errorCode?: string;
}

// Fetch vehicle valuation from external API
export async function fetchVehicleValuation(
  vin: string,
  mileage: number,
  gearbox: string,
  requestId: string
): Promise<ValuationResult> {
  try {
    // Get API credentials 
    const apiId = Deno.env.get("CAR_API_ID");
    const apiSecret = Deno.env.get("CAR_API_SECRET");
    
    if (!apiId || !apiSecret) {
      logOperation('missing_api_credentials', { requestId, vin }, 'error');
      return {
        success: false,
        error: "API credentials are missing",
        errorCode: "MISSING_CREDENTIALS"
      };
    }
    
    // Calculate checksum (md5 hash of API ID + API Secret + VIN)
    const input = `${apiId}${apiSecret}${vin}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('MD5', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const checksum = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Construct API URL and make request
    const apiUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${apiId}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/currency:PLN`;
    
    logOperation('external_api_request', { requestId, vin, mileage, gearbox });
    
    // Set a reasonable timeout for the fetch operation
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    try {
      const response = await fetch(apiUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        logOperation('api_response_error', { 
          requestId, 
          status: response.status,
          statusText: response.statusText
        }, 'error');
        
        return {
          success: false,
          error: `API responded with status: ${response.status}`,
          errorCode: "API_ERROR"
        };
      }
      
      const valuationData = await response.json();
      
      if (!valuationData || valuationData.error) {
        logOperation('api_returned_error', { 
          requestId, 
          error: valuationData?.error || "Unknown error"
        }, 'error');
        
        return {
          success: false,
          error: valuationData?.error || "Failed to get valuation",
          errorCode: "API_DATA_ERROR"
        };
      }
      
      // Extract valuation from results and calculate reserve price
      let valuation = valuationData.valuation;
      let reservePrice = calculateReservePrice(valuation);
      
      const vehicleData = {
        make: valuationData.make,
        model: valuationData.model,
        year: valuationData.year,
        transmission: gearbox,
        valuation: valuation,
        reservePrice: reservePrice,
        averagePrice: valuationData.price_med || valuation
      };
      
      logOperation('api_request_success', { 
        requestId, 
        make: vehicleData.make,
        model: vehicleData.model
      });
      
      return {
        success: true,
        data: vehicleData
      };
    } catch (fetchError) {
      // Check for timeout
      if (fetchError.name === 'AbortError') {
        logOperation('api_request_timeout', { requestId }, 'error');
        
        return {
          success: false,
          error: "Request timed out",
          errorCode: "TIMEOUT"
        };
      }
      
      // Other fetch errors
      logOperation('api_request_error', { 
        requestId, 
        error: fetchError.message 
      }, 'error');
      
      return {
        success: false,
        error: `Network error: ${fetchError.message}`,
        errorCode: "NETWORK_ERROR"
      };
    }
  } catch (error) {
    // General error handling
    logOperation('valuation_service_error', { 
      requestId, 
      error: error.message
    }, 'error');
    
    return {
      success: false,
      error: `Internal error: ${error.message}`,
      errorCode: "INTERNAL_ERROR"
    };
  }
}

// Calculate reserve price based on valuation and price tiers
function calculateReservePrice(basePrice: number): number {
  if (!basePrice || isNaN(basePrice)) {
    return 0;
  }
  
  let percentageDiscount;
  
  // Determine percentage based on price tier
  if (basePrice <= 15000) percentageDiscount = 0.65;
  else if (basePrice <= 20000) percentageDiscount = 0.46;
  else if (basePrice <= 30000) percentageDiscount = 0.37;
  else if (basePrice <= 50000) percentageDiscount = 0.27;
  else if (basePrice <= 60000) percentageDiscount = 0.27;
  else if (basePrice <= 70000) percentageDiscount = 0.22;
  else if (basePrice <= 80000) percentageDiscount = 0.23;
  else if (basePrice <= 100000) percentageDiscount = 0.24;
  else if (basePrice <= 130000) percentageDiscount = 0.20;
  else if (basePrice <= 160000) percentageDiscount = 0.185;
  else if (basePrice <= 200000) percentageDiscount = 0.22;
  else if (basePrice <= 250000) percentageDiscount = 0.17;
  else if (basePrice <= 300000) percentageDiscount = 0.18;
  else if (basePrice <= 400000) percentageDiscount = 0.18;
  else if (basePrice <= 500000) percentageDiscount = 0.16;
  else percentageDiscount = 0.145;
  
  // Apply formula: PriceX – (PriceX x PercentageY)
  const reservePrice = Math.round(basePrice - (basePrice * percentageDiscount));
  return reservePrice;
}
