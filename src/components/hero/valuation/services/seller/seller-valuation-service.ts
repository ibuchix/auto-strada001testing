
/**
 * Changes made:
 * - 2024-11-21: Extracted from seller-valuation.ts as part of refactoring
 */

import { supabase } from "@/integrations/supabase/client";
import { ValuationResult, TransmissionType } from "../../types";
import { hasEssentialData, handleApiError, storeReservationId } from "../utils/validation-helpers";
import { getSellerValuationCache, storeSellerValuationCache } from "./seller-valuation-cache";
import { fetchSellerValuationData } from "./seller-valuation-api";

/**
 * Process valuation for the seller page context
 */
export async function processSellerValuation(
  vin: string,
  mileage: number,
  gearbox: TransmissionType
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
          transmission: gearbox,
          error: 'User authentication required'
        }
      };
    }
    
    // Try to get cached valuation
    const cachedData = await getSellerValuationCache(vin, mileage);
    
    if (cachedData) {
      console.log('Using cached valuation data for VIN:', vin);
      
      // Even with cached data, we might need to create a reservation
      try {
        if (!cachedData.isExisting) {
          await createReservationFromCachedData(vin, userId, cachedData);
        }
      } catch (error) {
        console.error('Reservation error with cached data:', error);
        // Continue with the cached data even if reservation process fails
      }
      
      return {
        success: true,
        data: {
          ...cachedData,
          vin,
          transmission: gearbox
        }
      };
    }
    
    // No cache found, proceed with API call
    console.log('No cache found, fetching valuation from API for VIN:', vin);
    const response = await fetchSellerValuationData(vin, mileage, gearbox, userId);
    
    if (response.error) {
      throw response.error;
    }
    
    const { data } = response;
    
    console.log('Seller valuation raw response:', data);
    
    // Check if car already exists
    if (data?.data?.isExisting) {
      return {
        success: true,
        data: {
          vin,
          transmission: gearbox,
          isExisting: true,
          error: 'This vehicle has already been listed'
        }
      };
    }
    
    // Try to store reservation ID
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
          transmission: gearbox,
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
      transmission: gearbox
    };
    
    // Try to cache the data but do it in non-blocking way
    storeSellerValuationCache(vin, mileage, valuationData);
    
    console.log('Returning complete valuation data for seller context');
    return {
      success: true,
      data: valuationData
    };
  } catch (error: any) {
    return handleApiError(error, vin, gearbox);
  }
}

/**
 * Helper function to create reservation from cached data
 */
async function createReservationFromCachedData(vin: string, userId: string, valuationData: any): Promise<void> {
  try {
    const response = await supabase.functions.invoke('handle-seller-operations', {
      body: {
        operation: 'create_reservation',
        vin,
        userId,
        valuationData
      }
    });
    
    const responseData = response.data as { reservation?: { id?: string } } | null;
    
    if (responseData?.reservation?.id) {
      storeReservationId(responseData.reservation.id);
    }
  } catch (error) {
    console.error('Failed to create reservation:', error);
    // Non-critical error, just log it
  }
}
