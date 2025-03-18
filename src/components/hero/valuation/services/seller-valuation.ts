
/**
 * Changes made:
 * - 2024-07-25: Extracted seller valuation from valuationService.ts
 */

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ValuationResult, TransmissionType } from "../types";
import { fetchSellerValuation } from "./api/valuation-api";
import { 
  hasEssentialData, 
  handleApiError, 
  storeReservationId 
} from "./utils/validation-helpers";

/**
 * Process valuation for the seller context
 */
export async function processSellerValuation(
  vin: string,
  mileage: number,
  gearbox: string
): Promise<ValuationResult> {
  console.log('Processing seller context validation for VIN:', vin);
  
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error getting user:', userError);
      throw new Error('Authentication error. Please sign in and try again.');
    }
    
    if (!user) {
      throw new Error('You must be logged in to value a vehicle for selling.');
    }
    
    const { data, error } = await fetchSellerValuation(vin, mileage, gearbox, user.id);

    if (error) {
      console.error('Seller operation error:', error);
      
      if (error.message?.includes('rate limit') || error.code === 'RATE_LIMIT_EXCEEDED') {
        throw new Error('Too many requests. Please wait a moment before trying again.');
      }
      
      throw error;
    }

    console.log('Seller validation raw response:', data);

    // If the API returned an error
    if (!data.success) {
      const errorMessage = data.error || 'Unknown error occurred during valuation';
      const errorCode = data.errorCode || 'UNKNOWN_ERROR';
      
      if (errorCode === 'RATE_LIMIT_EXCEEDED') {
        throw new Error('Too many requests. Please wait a moment before trying again.');
      }
      
      throw new Error(errorMessage);
    }

    // Store reservation ID for car creation process
    storeReservationId(data?.data?.reservationId);

    // Check for existing vehicle first
    if (data?.data?.isExisting) {
      console.log('Vehicle already exists in database');
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

    // If we don't have essential data, mark as noData case
    if (!hasEssentialData(data?.data)) {
      console.log('Missing essential vehicle data, marking as noData case');
      return {
        success: true,
        data: {
          vin,
          transmission: gearbox as TransmissionType,
          noData: true,
          error: 'Could not retrieve complete vehicle information',
          reservationId: data?.data?.reservationId
        }
      };
    }

    // If we have all essential data, return complete response
    console.log('Returning complete vehicle data');
    return {
      success: true,
      data: {
        make: data.data.make,
        model: data.data.model,
        year: data.data.year,
        vin,
        transmission: gearbox as TransmissionType,
        valuation: data.data.valuation,
        averagePrice: data.data.averagePrice,
        reservePrice: data.data.reservePrice,
        isExisting: false,
        reservationId: data.data.reservationId
      }
    };
  } catch (error: any) {
    return handleApiError(error, vin, gearbox as TransmissionType);
  }
}
