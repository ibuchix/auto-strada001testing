
/**
 * Changes made:
 * - 2024-07-22: Extracted reservation management functionality from vin-validation.ts
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Database } from '../_shared/database.types.ts';
import { logOperation } from './utils.ts';

/**
 * Creates a new reservation for a VIN
 */
export async function createVinReservation(
  supabase: ReturnType<typeof createClient<Database>>,
  vin: string,
  userId: string,
  valuationData: any
) {
  const requestId = crypto.randomUUID();
  logOperation('createReservation_start', { requestId, vin, userId });

  try {
    // Create a reservation for this VIN
    const { data: reservation, error: reservationError } = await supabase
      .from('vin_reservations')
      .insert([
        {
          vin,
          user_id: userId,
          status: 'pending',
          valuation_data: valuationData
        }
      ])
      .select()
      .single();

    if (reservationError) {
      logOperation('reservation_creation_error', { 
        requestId,
        vin, 
        error: reservationError.message 
      }, 'error');
      throw reservationError;
    }

    // Activate the reservation
    await activateReservation(supabase, reservation.id, userId);
    
    return reservation;
  } catch (error) {
    logOperation('createReservation_error', { 
      requestId, 
      vin, 
      error: error.message 
    }, 'error');
    throw error;
  }
}

/**
 * Activates a VIN reservation after successful valuation
 */
export async function activateReservation(
  supabase: ReturnType<typeof createClient<Database>>,
  reservationId: string, 
  userId: string
): Promise<boolean> {
  const requestId = crypto.randomUUID();
  logOperation('activateReservation_start', { requestId, reservationId, userId });
  
  try {
    // Update reservation status to active
    const { data, error } = await supabase
      .from('vin_reservations')
      .update({
        status: 'active'
      })
      .eq('id', reservationId)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) {
      logOperation('activateReservation_error', { requestId, reservationId, error: error.message }, 'error');
      return false;
    }
    
    logOperation('activateReservation_success', { requestId, reservationId });
    return true;
  } catch (error) {
    logOperation('activateReservation_exception', { requestId, reservationId, error: error.message }, 'error');
    return false;
  }
}

/**
 * Validates if a reservation exists and belongs to the user
 */
export async function validateReservation(
  supabase: ReturnType<typeof createClient<Database>>,
  vin: string,
  userId: string
): Promise<{ 
  valid: boolean; 
  reservation?: any; 
  error?: string; 
}> {
  const requestId = crypto.randomUUID();
  logOperation('validateReservation_start', { requestId, vin, userId });
  
  try {
    // Find active reservation for this VIN
    const { data: reservation, error } = await supabase
      .from('vin_reservations')
      .select('*')
      .eq('vin', vin)
      .eq('status', 'active')
      .maybeSingle();
    
    if (error) {
      logOperation('validateReservation_error', { requestId, vin, error: error.message }, 'error');
      return { valid: false, error: 'Database error checking reservation' };
    }
    
    // If no reservation exists
    if (!reservation) {
      logOperation('validateReservation_no_reservation', { requestId, vin }, 'warn');
      return { valid: false, error: 'No active reservation found for this VIN' };
    }
    
    // Check if reservation belongs to this user
    if (reservation.user_id !== userId) {
      logOperation('validateReservation_wrong_user', { 
        requestId, 
        vin, 
        reservationUserId: reservation.user_id, 
        requestUserId: userId 
      }, 'warn');
      return { valid: false, error: 'This VIN is reserved by another user' };
    }
    
    // Check if reservation has expired
    const now = new Date();
    const expiresAt = new Date(reservation.expires_at);
    
    if (now > expiresAt) {
      logOperation('validateReservation_expired', { 
        requestId, 
        vin, 
        expiresAt: reservation.expires_at 
      }, 'warn');
      return { valid: false, error: 'Reservation has expired' };
    }
    
    logOperation('validateReservation_success', { requestId, reservationId: reservation.id });
    return { valid: true, reservation };
  } catch (error) {
    logOperation('validateReservation_exception', { requestId, vin, error: error.message }, 'error');
    return { valid: false, error: 'Error validating reservation' };
  }
}
