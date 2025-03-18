
/**
 * Changes made:
 * - 2024-07-25: Extracted seller valuation from valuationService.ts
 * - 2024-08-01: Added cache support to reduce API calls for identical VINs
 */

import { supabase } from "@/integrations/supabase/client";
import { ValuationResult, TransmissionType } from "../types";
import { hasEssentialData, handleApiError, storeReservationId } from "./utils/validation-helpers";
import { getCachedValuation, storeValuationCache } from "./api/cache-api";
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
    
    // First check if we have a cached valuation
    const cachedData = await getCachedValuation(vin, mileage);
    
    if (cachedData) {
      console.log('Using cached valuation data for VIN:', vin);
      // Even with cached data, we might need to create a reservation
      try {
        // Check if the vehicle already exists in the system
        if (!cachedData.isExisting) {
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
        }
      } catch (reservationError) {
        console.error('Error creating reservation with cached data:', reservationError);
        // We can still continue with the cached data even if reservation fails
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
    
    // Store reservation ID if available
    if (data?.data?.reservationId) {
      storeReservationId(data.data.reservationId);
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
    
    // Prepare the valuation data
    const valuationData = {
      make: data.data.make,
      model: data.data.model,
      year: data.data.year,
      valuation: data.data.valuation,
      averagePrice: data.data.averagePrice,
      reservePrice: data.data.reservePrice,
      isExisting: false
    };
    
    // Store the result in cache for future use
    storeValuationCache(vin, mileage, valuationData);
    
    console.log('Returning complete valuation data for seller context');
    return {
      success: true,
      data: {
        ...valuationData,
        vin,
        transmission: gearbox as TransmissionType
      }
    };
  } catch (error: any) {
    return handleApiError(error, vin, gearbox as TransmissionType);
  }
}
