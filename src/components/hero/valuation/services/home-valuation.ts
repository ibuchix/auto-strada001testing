
/**
 * Changes made:
 * - 2024-07-25: Extracted home valuation from valuationService.ts
 * - 2025-09-18: Added additional error handling and recovery mechanisms
 * - 2025-10-18: Fixed TypeScript type safety with TransmissionType
 * - 2025-10-20: Fixed reserve price calculation and display
 */

import { supabase } from "@/integrations/supabase/client";
import { ValuationResult, TransmissionType } from "../types";
import { getCachedValuation, storeValuationInCache } from "./api/cache-api";

/**
 * Process valuation for the home page context
 */
export async function processHomeValuation(
  vin: string,
  mileage: number,
  gearbox: TransmissionType
): Promise<ValuationResult> {
  console.log('Processing home page valuation for VIN:', vin);
  
  try {
    // Try to get cached valuation first for performance
    try {
      const cachedData = await getCachedValuation(vin, mileage);
      if (cachedData) {
        console.log('Using cached valuation data for VIN:', vin);
        return {
          success: true,
          data: {
            ...cachedData,
            vin,
            transmission: gearbox
          }
        };
      }
    } catch (cacheError) {
      console.warn('Cache error, continuing with API call:', cacheError);
      // Continue with API call - don't let cache errors block the flow
    }
    
    // Get valuation from API
    console.log('Calling valuation API for VIN:', vin);
    
    const startTime = Date.now();
    const { data, error } = await supabase.functions.invoke('handle-seller-operations', {
      body: {
        operation: 'validate_vin',
        vin,
        mileage,
        gearbox,
        userId: 'anonymous' // For home page context, we use anonymous
      },
      headers: {
        'X-Request-Timeout': '10000' // 10 second timeout on the edge function side
      }
    });
    const endTime = Date.now();
    
    console.log(`API response time: ${endTime - startTime}ms`);
    console.log('Raw API response:', data);
    
    if (error) {
      console.error('Valuation API error:', error);
      throw error;
    }
    
    if (!data.success) {
      console.error('Validation failed:', data.data?.error);
      return {
        success: false,
        data: {
          error: data.data?.error || 'Failed to validate VIN',
          vin,
          transmission: gearbox
        }
      };
    }
    
    // Successfully retrieved valuation data
    console.log('Valuation data successfully retrieved:', data.data);
    
    // Ensure valuation/reserve price is available
    if (data.data && !data.data.valuation && data.data.reservePrice) {
      data.data.valuation = data.data.reservePrice;
    } else if (data.data && !data.data.valuation && data.data.basePrice) {
      // Calculate reserve price from base price if available
      data.data.valuation = calculateReservePrice(data.data.basePrice);
    }
    
    // Store in cache for future use
    try {
      if (data.data && !data.data.isExisting) {
        await storeValuationInCache(vin, mileage, data.data);
      }
    } catch (cacheError) {
      console.warn('Failed to cache valuation data:', cacheError);
      // Non-critical, continue with operation
    }
    
    return {
      success: true,
      data: {
        ...data.data,
        vin,
        transmission: gearbox
      }
    };
    
  } catch (error: any) {
    console.error('Home valuation processing error:', error);
    
    // Check if this is a timeout or network error
    const isTimeoutError = error.message?.includes('timeout') || 
                          error.message?.includes('network') ||
                          error.code === 'ECONNABORTED' ||
                          error.code === 'ETIMEDOUT';
    
    return {
      success: false,
      data: {
        error: isTimeoutError 
          ? 'Connection timed out. Please try again later.' 
          : error.message || 'Failed to get valuation',
        vin,
        transmission: gearbox
      }
    };
  }
}

/**
 * Calculate reserve price based on the pricing tiers
 */
function calculateReservePrice(basePrice: number): number {
  let percentage = 0;
  
  // Determine percentage based on base price tiers
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
    percentage = 0.145; // 500,001+ PLN
  }
  
  // Calculate reserve price using the formula: basePrice - (basePrice * percentage)
  return Math.round(basePrice - (basePrice * percentage));
}
