
/**
 * VIN Reservation Status Checker
 * Created: 2025-05-06 - Extracted from listingService to separate concerns
 * 
 * This utility handles verification of VIN reservations through 
 * security definer functions to avoid RLS permission issues
 */

import { supabase } from "@/integrations/supabase/client";

/**
 * Check if a VIN reservation is valid using the security definer function
 * @param vin Vehicle Identification Number
 * @param userId Current user ID
 * @returns Object containing validation result
 */
export async function verifyVinReservation(vin: string, userId: string) {
  console.log('Verifying VIN reservation for:', { vin, userId });
  
  // Check if this is a temporary UUID reservation
  const tempReservedVin = localStorage.getItem('tempReservedVin');
  if (tempReservedVin && tempReservedVin === vin) {
    console.log('Found temporary VIN reservation, proceeding with it');
    return { 
      isValid: true, 
      isTemporary: true,
      reservation: {
        id: localStorage.getItem('vinReservationId'),
        vin: tempReservedVin
      }
    };
  }
  
  // Verify the reservation using the security definer function
  console.log('Checking reservation with security definer function');
  const { data: reservationCheck, error: reservationError } = await supabase
    .rpc('check_vin_reservation', {
      p_vin: vin,
      p_user_id: userId
    });

  if (reservationError) {
    console.error('Error checking VIN reservation:', reservationError);
    throw new Error(`Error verifying VIN reservation: ${reservationError.message}`);
  }
  
  if (!reservationCheck || !reservationCheck.exists || !reservationCheck.reservation) {
    console.error('VIN reservation not found or inactive:', reservationCheck);
    return {
      isValid: false,
      error: "Your VIN reservation has expired. Please validate your VIN in the Vehicle Details section."
    };
  }

  console.log('VIN reservation confirmed valid:', reservationCheck.reservation);
  return {
    isValid: true,
    isTemporary: false,
    reservation: reservationCheck.reservation
  };
}

/**
 * Clean up VIN reservation data from localStorage after successful operations
 */
export function cleanupVinReservation(): void {
  localStorage.removeItem('vinReservationId');
  localStorage.removeItem('tempReservedVin');
  console.log('VIN reservation data cleared from localStorage');
}
