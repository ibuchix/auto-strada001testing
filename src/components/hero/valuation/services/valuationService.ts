/**
 * Changes made:
 * - Added non-blocking cache operations
 * - Improved error handling for cache failures
 * - Made cache operations run in parallel with main flow
 * - 2024-03-19: Initial implementation of valuation service
 * - 2024-03-19: Added support for different contexts (home/seller)
 * - 2024-03-19: Enhanced error handling and response processing
 * - 2024-03-26: Fixed TypeScript errors related to TransmissionType
 * - 2024-07-20: Refactored for more robust error handling and rate limiting awareness
 * - 2024-07-25: Refactored into smaller modules for better maintainability
 * - 2025-05-15: Further refactored into context-specific modules for improved separation of concerns
 * - 2025-09-18: Added request timeout handling and additional error recovery
 * - 2025-10-18: Fixed TypeScript type errors related to TransmissionType casting
 * - 2025-10-19: Fixed duplicate export issues causing SyntaxError
 * - 2025-11-01: Fixed VIN validation flow with improved error handling and logging
 */

import { ValuationResult, TransmissionType } from "../types";
import { processHomeValuation } from "./home-valuation";
import { processSellerValuation } from "./seller-valuation";
import { supabase } from "@/integrations/supabase/client";

/**
 * Cleans up any stale valuation data from localStorage
 */
export const cleanupValuationData = () => {
  localStorage.removeItem('valuationData');
  localStorage.removeItem('tempVIN');
  localStorage.removeItem('tempMileage');
  localStorage.removeItem('tempGearbox');
  localStorage.removeItem('vinReservationId');
};

/**
 * Gets a valuation for a vehicle based on VIN, mileage, and transmission type.
 * This is the main entry point for all valuation operations.
 */
export const getValuation = async (
  vin: string,
  mileage: number,
  gearbox: string,
  context: 'home' | 'seller' = 'home'
): Promise<ValuationResult> => {
  // Generate a unique request ID for tracing this valuation request
  const requestId = Math.random().toString(36).substring(2, 12);
  
  try {
    console.log(`Starting valuation for VIN: ${vin} in ${context} context`);
    
    // Add request tracking to localStorage to help with troubleshooting
    try {
      localStorage.setItem('lastValuationAttempt', JSON.stringify({
        vin,
        mileage,
        gearbox,
        context,
        timestamp: new Date().toISOString()
      }));
    } catch (e) {
      console.warn('Failed to store valuation attempt info:', e);
      // Non-critical, continue with operation
    }
    
    // Validate inputs before proceeding
    if (!vin || vin.length < 11 || vin.length > 17) {
      console.error('Invalid VIN format:', vin);
      return {
        success: false,
        data: {
          error: 'Invalid VIN format. Please enter a valid 17-character VIN.',
          vin,
          transmission: gearbox as TransmissionType
        }
      };
    }

    if (isNaN(mileage) || mileage < 0) {
      console.error('Invalid mileage value:', mileage);
      return {
        success: false,
        data: {
          error: 'Please enter a valid mileage value.',
          vin,
          transmission: gearbox as TransmissionType
        }
      };
    }
    
    // Get user ID if logged in
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId && context === "seller") {
      throw new Error("Authentication required to get valuation as a seller");
    }
    
    // Try to fetch from cache in parallel with main request
    const cachePromise = fetchCachedValuation(vin, mileage);
    
    // Start main valuation request immediately (don't wait for cache)
    const valuationPromise = supabase.functions.invoke("handle-seller-operations", {
      body: {
        operation: "get_valuation",
        vin,
        mileage,
        gearbox,
        userId: userId || "anonymous",
        requestId
      },
    });
    
    // Race between cache and main request
    const results = await Promise.allSettled([
      cachePromise.catch(() => null), 
      valuationPromise
    ]);
    
    // Check if cache had a hit
    if (results[0].status === 'fulfilled' && results[0].value) {
      console.log('Using cached valuation data');
      return {
        success: true,
        data: results[0].value
      };
    }
    
    // Otherwise use main request result
    if (results[1].status !== 'fulfilled') {
      throw new Error(results[1].reason || "Failed to get valuation");
    }
    
    const { data, error } = results[1].value;
    
    if (error) {
      throw new Error(error);
    }
    
    if (!data || !data.success) {
      const errorMessage = data?.error || "Failed to get vehicle valuation";
      throw new Error(errorMessage);
    }
    
    // If we have data to cache and it was a non-cache hit, store it asynchronously
    if (data.data && !results[0].value) {
      storeValuationInCache(vin, mileage, data.data).catch(err => {
        console.warn('Failed to store valuation in cache:', err);
      });
    }
    
    // Delegate to the appropriate context handler with timeout
    const timeoutPromise = new Promise<ValuationResult>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Request timed out'));
      }, 15000); // 15 second timeout
    });
    
    // Cast the gearbox string to TransmissionType for type safety
    const transmissionType = gearbox as TransmissionType;
    
    console.log(`Calling ${context} valuation processor with:`, { vin, mileage, transmissionType });
    
    const valuationPromiseWithData = context === 'seller' 
      ? processSellerValuation(vin, mileage, transmissionType, data.data)
      : processHomeValuation(vin, mileage, transmissionType, data.data);
    
    // Race between the valuation and the timeout
    return await Promise.race([valuationPromiseWithData, timeoutPromise]);
  } catch (error: any) {
    console.error(`Valuation error for VIN ${vin}:`, error);
    
    // Create a standardized error response
    if (error.message === 'Request timed out') {
      return {
        success: false,
        data: {
          error: 'Request timed out. Please try again.',
          vin,
          transmission: gearbox as TransmissionType
        }
      };
    }
    
    return {
      success: false,
      data: {
        error: error.message || 'An unexpected error occurred',
        vin,
        transmission: gearbox as TransmissionType
      }
    };
  }
};

/**
 * Fetch cached valuation data - returns null if not found or error
 * Non-blocking with timeout
 */
async function fetchCachedValuation(vin: string, mileage: number): Promise<any | null> {
  try {
    // Wrap in a timeout to ensure it doesn't block the main flow
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Cache lookup timed out')), 2000);
    });
    
    const cachePromise = supabase.functions.invoke("handle-seller-operations", {
      body: {
        operation: "get_cached_valuation",
        vin,
        mileage
      }
    });
    
    // Race the cache lookup against the timeout
    const { data } = await Promise.race([cachePromise, timeoutPromise]);
    
    if (data?.success && data?.data) {
      return data.data;
    }
    
    return null;
  } catch (error) {
    console.warn("Cache lookup failed:", error.message);
    return null;
  }
}

/**
 * Store valuation in cache asynchronously - fire and forget
 */
function storeValuationInCache(vin: string, mileage: number, valuationData: any): Promise<void> {
  // Don't await this, should be non-blocking
  return supabase.functions.invoke("handle-seller-operations", {
    body: {
      operation: "cache_valuation",
      vin,
      mileage,
      valuation_data: valuationData
    }
  }).then(() => {
    console.log("Valuation stored in cache");
  }).catch(error => {
    console.warn("Failed to store in cache:", error.message);
  });
}
