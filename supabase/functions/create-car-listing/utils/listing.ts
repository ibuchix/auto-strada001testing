
/**
 * Listing utilities for create-car-listing
 * Created: 2025-05-06 - Moved from external dependency to local implementation
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { logOperation } from "./logging.ts";

/**
 * Validates and updates VIN reservation status
 * 
 * @param supabase Supabase client
 * @param userId User ID
 * @param vin VIN to validate
 * @param reservationId Reservation ID (optional)
 * @param requestId Request ID for tracking
 * @returns Validation result with success flag
 */
export async function validateVinReservation(
  supabase: SupabaseClient,
  userId: string,
  vin: string,
  reservationId: string | undefined,
  requestId: string
): Promise<{ valid: boolean; error?: string }> {
  // Skip validation if no reservation ID provided
  if (!reservationId) {
    logOperation('no_reservation_id', { requestId, userId, vin }, 'info');
    return { valid: true };
  }
  
  try {
    const { data: reservation, error: reservationError } = await supabase
      .from('vin_reservations')
      .select('*')
      .eq('id', reservationId)
      .eq('user_id', userId)
      .eq('vin', vin)
      .eq('status', 'active')
      .single();
    
    if (reservationError || !reservation) {
      logOperation('invalid_reservation', {
        requestId,
        reservationId,
        userId,
        vin,
        error: reservationError?.message
      }, 'error');
      
      return { valid: false, error: "Invalid or expired VIN reservation" };
    }
    
    logOperation('valid_reservation', { 
      requestId, 
      reservationId, 
      userId,
      vin
    });
    
    return { valid: true };
  } catch (error) {
    logOperation('reservation_validation_error', {
      requestId,
      reservationId,
      userId,
      vin,
      error: (error as Error).message
    }, 'error');
    
    return { valid: false, error: "Failed to validate reservation" };
  }
}

/**
 * Marks a VIN reservation as used
 * 
 * @param supabase Supabase client
 * @param reservationId Reservation ID
 * @param requestId Request ID for tracking
 */
export async function markReservationAsUsed(
  supabase: SupabaseClient,
  reservationId: string,
  requestId: string
): Promise<void> {
  try {
    await supabase
      .from('vin_reservations')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', reservationId);
    
    logOperation('reservation_marked_used', { 
      requestId, 
      reservationId 
    });
  } catch (error) {
    logOperation('mark_reservation_error', {
      requestId,
      reservationId,
      error: (error as Error).message
    }, 'warn');
  }
}

/**
 * Creates a car listing using the security definer function or direct insert
 * 
 * @param supabase Supabase client
 * @param listingData Car listing data
 * @param userId User ID
 * @param requestId Request ID for tracking
 * @returns Result with created listing data or error
 */
export async function createListing(
  supabase: SupabaseClient,
  listingData: any,
  userId: string,
  requestId: string
): Promise<{ success: boolean; data?: any; error?: Error }> {
  try {
    // Try to use the security definer function first
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      'create_car_listing',
      { p_car_data: listingData, p_user_id: userId }
    );

    if (!rpcError && rpcResult && rpcResult.success) {
      logOperation('listing_created_via_rpc', {
        requestId,
        carId: rpcResult.car_id
      });
      
      return { success: true, data: rpcResult };
    }
    
    if (rpcError) {
      logOperation('rpc_failed', {
        requestId,
        error: rpcError.message
      }, 'warn');
    }
    
    // Fallback to direct insert
    const { data: listing, error: listingError } = await supabase
      .from('cars')
      .insert(listingData)
      .select()
      .single();

    if (listingError) {
      logOperation('direct_insert_failed', {
        requestId,
        error: listingError.message
      }, 'error');
      
      return { success: false, error: listingError };
    }

    logOperation('listing_created_via_direct_insert', {
      requestId,
      carId: listing.id
    });
    
    return { success: true, data: listing };
  } catch (error) {
    logOperation('create_listing_error', {
      requestId,
      error: (error as Error).message
    }, 'error');
    
    return { success: false, error: error as Error };
  }
}
