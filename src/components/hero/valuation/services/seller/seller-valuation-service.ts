/**
 * Changes made:
 * - 2024-11-21: Extracted from seller-valuation.ts as part of refactoring
 * - 2024-11-24: Enhanced data processing and error handling
 * - 2024-11-24: Added forced recalculation of reserve price as fallback
 * - 2024-11-24: Improved logging to track data through the pipeline
 * - 2028-06-12: Enhanced pipeline logging and fallback mechanisms
 * - 2028-06-12: Added data validation checks at multiple points in the process
 * - 2028-06-13: Fixed Promise handling for cache storage to avoid void.catch error
 */

import { supabase } from "@/integrations/supabase/client";
import { ValuationResult, TransmissionType } from "../../types";
import { hasEssentialData, handleApiError, storeReservationId } from "../utils/validation-helpers";
import { fetchSellerValuationData } from "./seller-valuation-api";

/**
 * Ensure we have a valid reserve price by calculating it if necessary
 */
function ensureValidReservePrice(data: any): any {
  if (!data) return data;
  
  let basePrice = data.basePrice || data.averagePrice || data.price_med || 0;
  let reservePrice = data.reservePrice || data.valuation || 0;
  
  console.log('Price check before validation:', { basePrice, reservePrice });
  
  // If we have a base price but no reserve price, calculate it
  if (basePrice > 0 && (!reservePrice || reservePrice <= 0)) {
    // Calculate reserve price using the standard formula
    let percentage = 0;
    
    if (basePrice <= 15000) percentage = 0.65;
    else if (basePrice <= 20000) percentage = 0.46;
    else if (basePrice <= 30000) percentage = 0.37;
    else if (basePrice <= 50000) percentage = 0.27;
    else if (basePrice <= 60000) percentage = 0.27;
    else if (basePrice <= 70000) percentage = 0.22;
    else if (basePrice <= 80000) percentage = 0.23;
    else if (basePrice <= 100000) percentage = 0.24;
    else if (basePrice <= 130000) percentage = 0.20;
    else if (basePrice <= 160000) percentage = 0.185;
    else if (basePrice <= 200000) percentage = 0.22;
    else if (basePrice <= 250000) percentage = 0.17;
    else if (basePrice <= 300000) percentage = 0.18;
    else if (basePrice <= 400000) percentage = 0.18;
    else if (basePrice <= 500000) percentage = 0.16;
    else percentage = 0.145;
    
    reservePrice = Math.round(basePrice - (basePrice * percentage));
    console.log('Calculated reserve price:', { basePrice, percentage, reservePrice });
    
    return {
      ...data,
      reservePrice,
      valuation: reservePrice // Add both for compatibility with various components
    };
  }
  
  // If we still don't have a valid reserve price but have valuation or price fields, use them
  if ((!reservePrice || reservePrice <= 0) && (data.price > 0 || data.valuation > 0 || data.price_med > 0)) {
    const fallbackPrice = data.price || data.valuation || data.price_med;
    console.log('Using fallback price:', fallbackPrice);
    
    return {
      ...data,
      reservePrice: fallbackPrice,
      valuation: fallbackPrice
    };
  }
  
  // Final fallback - we really don't want to return invalid data to the UI
  if ((!reservePrice || reservePrice <= 0) && (!basePrice || basePrice <= 0)) {
    const placeholderValue = 25000; // Arbitrary placeholder
    console.warn('No valid price data available, using placeholder:', placeholderValue);
    
    return {
      ...data,
      basePrice: placeholderValue,
      reservePrice: placeholderValue,
      valuation: placeholderValue,
      isPlaceholder: true // Flag that this is a placeholder
    };
  }
  
  return data;
}

/**
 * Process valuation for the seller page context
 */
export async function processSellerValuation(
  vin: string,
  mileage: number,
  gearbox: TransmissionType
): Promise<ValuationResult> {
  console.log('Processing seller page valuation for VIN:', vin);
  console.log('Valuation pipeline started:', { 
    vin, 
    mileage, 
    gearbox,
    timestamp: new Date().toISOString(),
    pipelineId: `pipeline_${Date.now()}`
  });
  
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
    
    // No cache check - proceed directly with API call
    console.log('Fetching valuation from API for VIN:', vin);
    
    try {
      const response = await fetchSellerValuationData(vin, mileage, gearbox, userId);
      
      if (response.error) {
        throw response.error;
      }
      
      const { data } = response;
      
      console.log('Seller valuation raw response:', data);
      
      // Check if car already exists
      if (data?.isExisting || data?.data?.isExisting) {
        console.log('Vehicle already exists in system:', vin);
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
      
      // Extract the actual data object, handling nested structure if present
      const valuationData = data?.data || data;
      
      console.log('Extracted valuation data structure:', {
        hasData: !!valuationData,
        topLevelKeys: Object.keys(valuationData || {}),
        nestedDataKeys: valuationData?.data ? Object.keys(valuationData.data) : 'no nested data'
      });
      
      // Try to store reservation ID
      if (valuationData?.reservationId) {
        storeReservationId(valuationData.reservationId);
      }
      
      // If we don't have essential data
      if (!hasEssentialData(valuationData)) {
        console.log('No essential data found for VIN in seller context');
        console.log('Missing data details:', {
          hasMake: !!valuationData?.make,
          hasModel: !!valuationData?.model,
          hasYear: !!valuationData?.year,
          hasValuation: !!(valuationData?.valuation || valuationData?.reservePrice)
        });
        
        return {
          success: false,
          data: {
            vin,
            transmission: gearbox,
            noData: true,
            error: 'No data found for this VIN'
          }
        };
      }
      
      // Ensure we have a valid reserve price by calculating it if necessary
      const enhancedValuationData = ensureValidReservePrice(valuationData);
      
      // Prepare the valuation data with required fields
      const normalizedData = {
        make: enhancedValuationData.make,
        model: enhancedValuationData.model,
        year: enhancedValuationData.year,
        valuation: enhancedValuationData.valuation || enhancedValuationData.reservePrice,
        averagePrice: enhancedValuationData.averagePrice || enhancedValuationData.basePrice || enhancedValuationData.price_med,
        reservePrice: enhancedValuationData.reservePrice || enhancedValuationData.valuation,
        basePrice: enhancedValuationData.basePrice || enhancedValuationData.averagePrice || enhancedValuationData.price_med,
        isExisting: false,
        isPlaceholder: enhancedValuationData.isPlaceholder || false,
        vin,
        transmission: gearbox
      };
      
      // Log the normalized data to ensure it has the necessary properties
      console.log('Normalized valuation data:', normalizedData);
      
      console.log('Returning complete valuation data for seller context');
      return {
        success: true,
        data: normalizedData
      };
    } catch (apiError) {
      console.error('API error during valuation fetch:', apiError);
      return handleApiError(apiError, vin, gearbox);
    }
  } catch (error: any) {
    console.error('Uncaught error in valuation pipeline:', error);
    return handleApiError(error, vin, gearbox);
  }
}

/**
 * Helper function to create reservation from cached data
 */
async function createReservationFromCachedData(vin: string, userId: string, valuationData: any): Promise<void> {
  console.log('Creating reservation from cached data:', { vin, userId });
  
  try {
    const response = await supabase.functions.invoke('handle-seller-operations', {
      body: {
        operation: 'create_reservation',
        vin,
        userId,
        valuationData,
        source: 'cache'
      }
    });
    
    const responseData = response.data as { reservation?: { id?: string } } | null;
    
    if (responseData?.reservation?.id) {
      storeReservationId(responseData.reservation.id);
      console.log('Successfully created reservation from cached data:', responseData.reservation.id);
    } else {
      console.warn('Reservation creation from cache did not return expected data:', responseData);
    }
  } catch (error) {
    console.error('Failed to create reservation:', error);
    // Non-critical error, just log it
  }
}
