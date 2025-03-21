
/**
 * Changes made:
 * - 2024-07-25: Extracted seller valuation from valuationService.ts
 * - 2024-08-01: Added cache support to reduce API calls for identical VINs
 * - 2024-08-02: Fixed type issues when caching valuation data
 * - 2025-04-22: Enhanced error handling and cache interaction
 * - 2025-04-23: Improved cache function integration with enhanced error handling
 * - 2025-04-27: Updated imports for refactored cache-api module
 * - 2025-04-28: Fixed method name mismatches for TypeScript compatibility
 * - 2025-05-15: Refined implementation with improved separation of concerns
 * - 2025-05-16: Fixed import function name to match exported name
 * - 2025-05-17: Fixed function name references to match actual exports
 * - 2025-07-07: Completely isolated cache operations from main valuation flow
 */

import { supabase } from "@/integrations/supabase/client";
import { ValuationResult, TransmissionType } from "../types";
import { hasEssentialData, handleApiError, storeReservationId } from "./utils/validation-helpers";
import { getCachedValuation, storeValuationInCache } from "./api/cache-api";
import { fetchSellerValuation } from "./api/valuation-api";

/**
 * Process valuation for the seller page context
 */
export async function processSellerValuation(
  vin: string,
  mileage: number,
  gearbox: string
): Promise<ValuationResult> {
  console.log('Processing seller page valuation for VIN:', vin);
  
  try {
    // Check if user is authenticated
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    
    if (!userId) {
      console.log('No authenticated user found, redirecting to authentication');
      return {
        success: false,
        data: {
          vin,
          transmission: gearbox as TransmissionType,
          error: 'User authentication required'
        }
      };
    }
    
    // Try to get cached valuation, but continue even if it fails
    let cachedData = null;
    try {
      cachedData = await getCachedValuation(vin, mileage);
      if (cachedData) {
        console.log('Using cached valuation data for VIN:', vin);
      }
    } catch (cacheError) {
      console.warn('Cache retrieval error, continuing with API call:', cacheError);
      // Continue with API call - don't let cache errors block the flow
    }
    
    if (cachedData) {
      // Even with cached data, we might need to create a reservation
      try {
        // Check if the vehicle already exists in the system
        if (!cachedData.isExisting) {
          try {
            const { data: reservationData } = await supabase.functions.invoke('handle-seller-operations', {
              body: {
                operation: 'create_reservation',
                vin,
                userId,
                valuationData: cachedData
              }
            });
            
            if (reservationData?.reservation?.id) {
              storeReservationId(reservationData.reservation.id);
            }
          } catch (reservationError) {
            console.error('Reservation error with cached data:', reservationError);
            // Continue anyway - reservation is not critical
          }
        }
      } catch (error) {
        console.error('Error in reservation process:', error);
        // Continue with the cached data even if reservation process fails
      }
      
      return {
        success: true,
        data: {
          ...cachedData,
          vin,
          transmission: gearbox as TransmissionType
        }
      };
    }
    
    // No cache found, proceed with API call
    console.log('No cache found, fetching valuation from API for VIN:', vin);
    const { data, error } = await fetchSellerValuation(vin, mileage, gearbox, userId);
    
    if (error) {
      console.error('Seller valuation error:', error);
      
      if (error.message?.includes('rate limit')) {
        throw new Error('Too many requests. Please wait a moment before trying again.');
      }
      
      throw error;
    }
    
    console.log('Seller valuation raw response:', data);
    
    // Check if car already exists
    if (data?.data?.isExisting) {
      return {
        success: true,
        data: {
          vin,
          transmission: gearbox as TransmissionType,
          isExisting: true,
          error: 'This vehicle has already been listed'
        }
      };
    }
    
    // Try to store reservation ID, but don't let failures block the flow
    try {
      if (data?.data?.reservationId) {
        storeReservationId(data.data.reservationId);
      }
    } catch (storageError) {
      console.error('Non-critical error storing reservation ID:', storageError);
      // Continue regardless
    }
    
    // If we don't have essential data
    if (!hasEssentialData(data?.data)) {
      console.log('No essential data found for VIN in seller context');
      return {
        success: true,
        data: {
          vin,
          transmission: gearbox as TransmissionType,
          noData: true,
          error: 'No data found for this VIN'
        }
      };
    }
    
    // Prepare the valuation data with required fields
    const valuationData = {
      make: data.data.make,
      model: data.data.model,
      year: data.data.year,
      valuation: data.data.valuation,
      averagePrice: data.data.averagePrice,
      reservePrice: data.data.reservePrice,
      isExisting: false,
      vin,
      transmission: gearbox as TransmissionType
    };
    
    // Try to cache the data but do it in non-blocking way
    try {
      // Use Promise.resolve to make this non-blocking
      Promise.resolve().then(() => {
        storeValuationInCache(vin, mileage, valuationData).catch(error => {
          console.log('Non-critical cache error:', error);
          // Swallow the error - cache operations should never block
        });
      });
    } catch (cacheError) {
      // Just log and continue - caching is non-critical
      console.warn('Failed to initiate cache operation:', cacheError);
    }
    
    console.log('Returning complete valuation data for seller context');
    return {
      success: true,
      data: valuationData
    };
  } catch (error: any) {
    return handleApiError(error, vin, gearbox as TransmissionType);
  }
};
