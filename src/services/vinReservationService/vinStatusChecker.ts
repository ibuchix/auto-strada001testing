
/**
 * VIN Status Checker Service
 * Created: 2025-05-08 - Extracted from reservationRecoveryService for better modularity
 * Updated: 2025-05-17 - Added comprehensive error handling and validation
 * Updated: 2025-05-18 - Fixed permission issue by using RPC function instead of direct table access
 * Updated: 2025-06-12 - Updated error handling and comments for better clarity
 * Updated: 2025-06-13 - Enhanced error handling for missing RPC function and added fallback mechanism
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
    
    // For database reservations, try RPC function first with fallback
    try {
      console.log(`Checking reservation validity for VIN: ${vin}, using RPC function`);
      
      const { data, error } = await supabase.rpc(
        'check_vin_reservation',
        { 
          p_vin: vin,
          p_user_id: userId
        }
      );
      
      if (error) {
        console.error('RPC error verifying reservation:', error);
        
        // If the function doesn't exist or other error, try fallback direct check
        if (error.message?.includes('does not exist') || error.code === '404') {
          console.log('RPC function not found, using fallback verification method');
          return await fallbackVerifyReservation(vin, userId, reservationId);
        }
        
        // For other errors, accept the reservation to prevent blocking user progress
        console.warn('Using permissive fallback due to RPC error');
        return { isValid: true };
      }
      
      if (!data || !data.exists) {
        console.log('RPC check returned no reservation or expired reservation:', data);
        return { isValid: false, error: data?.message || "Reservation not found or expired" };
      }
      
      // Check reservation details from the RPC response
      const reservationDetails = data.reservation;
      
      if (reservationDetails && reservationDetails.vin !== vin) {
        return { isValid: false, error: "Reservation VIN mismatch" };
      }
      
      console.log('Valid reservation confirmed via RPC');
      return { isValid: true };
    } catch (dbError) {
      // If there's an error checking the database, log it but accept the reservation
      console.error('Database error in verifyVinReservation:', dbError);
      return { isValid: true };
    }
  } catch (error) {
    console.error('Error in verifyVinReservation:', error);
    // Fall back to accepting the reservation if verification fails
    return { isValid: true };
  }
}

/**
 * Fallback method to check reservation directly in the database
 * Only used if the RPC function is not available
 */
async function fallbackVerifyReservation(
  vin: string, 
  userId: string, 
  reservationId: string
): Promise<{ isValid: boolean; error?: string }> {
  try {
    console.log('Using fallback method to verify reservation');
    
    const { data: reservation, error } = await supabase
      .from('vin_reservations')
      .select('*')
      .eq('id', reservationId)
      .eq('vin', vin)
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();
    
    if (error) {
      console.error('Fallback verification error:', error);
      // If we can't verify, better to let the user continue
      return { isValid: true };
    }
    
    if (!reservation) {
      return { isValid: false, error: "Reservation not found" };
    }
    
    // Check if reservation has expired
    const now = new Date();
    const expiresAt = new Date(reservation.expires_at);
    
    if (now > expiresAt) {
      return { isValid: false, error: "Reservation has expired" };
    }
    
    return { isValid: true };
  } catch (error) {
    console.error('Error in fallback verification:', error);
    // Accept the reservation if there's an error
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
