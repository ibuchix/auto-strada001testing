
/**
 * Changes made:
 * - 2024-07-25: Extracted home valuation from valuationService.ts
 * - 2025-09-18: Added additional error handling and recovery mechanisms
 * - 2025-10-18: Fixed TypeScript type safety with TransmissionType
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
    console.log('Valuation data successfully retrieved');
    
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
