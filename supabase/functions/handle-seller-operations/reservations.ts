
/**
 * Changes made:
 * - 2024-07-18: Enhanced with better reservation management functions
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { logOperation } from './utils.ts';

export async function createVinReservation(supabase: SupabaseClient, vin: string, userId: string) {
  const expirationTime = new Date();
  expirationTime.setMinutes(expirationTime.getMinutes() + 30); // 30 minute reservation

  const { data: reservation, error: reservationError } = await supabase
    .from('vin_reservations')
    .insert({
      vin,
      user_id: userId,
      expires_at: expirationTime.toISOString(),
    })
    .select()
    .single();

  if (reservationError) {
    console.error('Failed to create VIN reservation:', reservationError);
    throw new Error('Failed to reserve VIN');
  }

  return reservation;
}

export async function checkExistingReservation(supabase: SupabaseClient, vin: string) {
  const { data: existingReservation } = await supabase
    .from('vin_reservations')
    .select('*')
    .eq('vin', vin)
    .eq('status', 'active')
    .single();

  return existingReservation;
}

/**
 * Activates a VIN reservation after successful valuation
 */
export async function activateReservation(supabase: SupabaseClient, reservationId: string, userId: string): Promise<boolean> {
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
export async function validateReservation(supabase: SupabaseClient, vin: string, userId: string): Promise<{ 
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

/**
 * Releases a VIN reservation (marks as completed or cancels it)
 */
export async function releaseReservation(supabase: SupabaseClient, reservationId: string, status: 'completed' | 'cancelled' = 'completed'): Promise<boolean> {
  const requestId = crypto.randomUUID();
  logOperation('releaseReservation_start', { requestId, reservationId, status });
  
  try {
    const { error } = await supabase
      .from('vin_reservations')
      .update({
        status: status
      })
      .eq('id', reservationId);
    
    if (error) {
      logOperation('releaseReservation_error', { requestId, reservationId, error: error.message }, 'error');
      return false;
    }
    
    logOperation('releaseReservation_success', { requestId, reservationId, status });
    return true;
  } catch (error) {
    logOperation('releaseReservation_exception', { requestId, reservationId, error: error.message }, 'error');
    return false;
  }
}
