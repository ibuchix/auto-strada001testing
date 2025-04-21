
/**
 * Changes made:
 * - 2024-07-22: Created dedicated handler for create listing requests
 * - 2025-04-21: Updated import paths to use local utils instead of shared
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { logOperation } from "../utils/logging.ts";

/**
 * Handle create listing requests
 */
export async function handleCreateListingRequest(
  supabase: SupabaseClient,
  data: {
    userId: string;
    vin: string;
    valuationData: any;
    mileage: number;
    transmission: string;
    reservationId?: string;
  },
  requestId: string
) {
  // Verify reservation if provided
  if (data.reservationId) {
    const { data: validReservation, error: reservationError } = await supabase
      .from('vin_reservations')
      .select('*')
      .eq('id', data.reservationId)
      .eq('user_id', data.userId)
      .eq('vin', data.vin)
      .eq('status', 'active')
      .single();
      
    if (reservationError || !validReservation) {
      logOperation('invalid_reservation', {
        requestId,
        reservationId: data.reservationId,
        error: reservationError?.message
      }, 'error');
      
      return {
        success: false,
        error: "Invalid or expired VIN reservation"
      };
    }
  }
  
  // Create the car listing
  const { data: car, error: createError } = await supabase.rpc('create_car_listing', {
    p_car_data: {
      seller_id: data.userId,
      make: data.valuationData.make,
      model: data.valuationData.model,
      year: data.valuationData.year,
      mileage: data.mileage,
      price: data.valuationData.price_med || data.valuationData.averagePrice,
      vin: data.vin,
      is_draft: true,
      transmission: data.transmission,
      valuation_data: data.valuationData
    },
    p_user_id: data.userId
  });
  
  if (createError) {
    logOperation('create_listing_error', {
      requestId,
      error: createError.message
    }, 'error');
    
    return {
      success: false,
      error: "Failed to create listing: " + createError.message
    };
  }
  
  // Mark reservation as used if provided
  if (data.reservationId) {
    await supabase
      .from('vin_reservations')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', data.reservationId);
  }
  
  logOperation('create_listing_success', {
    requestId,
    carId: car.car_id
  });
  
  return {
    success: true,
    data: car
  };
}
