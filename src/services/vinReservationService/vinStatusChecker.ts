
/**
 * VIN Status Checker Service
 * Created: 2025-05-08 - Extracted from reservationRecoveryService for better modularity
 */

import { supabase } from "@/integrations/supabase/client";

/**
 * Verify that a VIN reservation is valid
 * Works with both database reservations and temporary client-side reservations
 * 
 * @param vin VIN to verify
 * @param userId User ID
 * @returns Validation result
 */
export async function verifyVinReservation(
  vin: string,
  userId: string
): Promise<{ isValid: boolean; error?: string }> {
  try {
    const reservationId = localStorage.getItem('vinReservationId');
    
    if (!reservationId) {
      return { isValid: false, error: "No VIN reservation found" };
    }
    
    // For temporary reservations, just check if the VIN matches
    if (reservationId.startsWith('temp_')) {
      const tempVin = localStorage.getItem('tempReservedVin');
      if (tempVin === vin) {
        return { isValid: true };
      }
      return { isValid: false, error: "Temporary reservation VIN mismatch" };
    }
    
    // For database reservations, check if it exists and is valid
    const { data, error } = await supabase
      .from('vin_reservations')
      .select('id, status, expires_at, vin')
      .eq('id', reservationId)
      .maybeSingle();
    
    if (error) {
      console.error('Error verifying reservation:', error);
      // Fall back to accepting the reservation if database check fails
      return { isValid: true };
    }
    
    if (!data) {
      return { isValid: false, error: "Reservation not found" };
    }
    
    if (data.vin !== vin) {
      return { isValid: false, error: "Reservation VIN mismatch" };
    }
    
    if (data.status !== 'active') {
      return { isValid: false, error: "Reservation is not active" };
    }
    
    const expiresAt = new Date(data.expires_at);
    if (expiresAt < new Date()) {
      return { isValid: false, error: "Reservation has expired" };
    }
    
    return { isValid: true };
  } catch (error) {
    console.error('Error in verifyVinReservation:', error);
    // Fall back to accepting the reservation if verification fails
    return { isValid: true };
  }
}

/**
 * Clean up VIN reservation data from localStorage
 */
export function cleanupVinReservation(): void {
  localStorage.removeItem('vinReservationId');
  localStorage.removeItem('tempReservedVin');
  localStorage.removeItem('tempReservationCreatedAt');
}
