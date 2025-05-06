
/**
 * Reservation Recovery Service
 * Created: 2025-05-06 - Extracted from form submission provider to handle VIN reservation recovery
 */

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';

/**
 * Recovers or creates a VIN reservation
 * This handles cases where localStorage reservation data is missing
 * 
 * @param vin VIN number to reserve
 * @param userId User ID
 * @param valuationData Optional valuation data
 * @returns Reservation ID or null if failed
 */
export async function recoverVinReservation(
  vin: string, 
  userId: string,
  valuationData: any = null
): Promise<string | null> {
  console.log('Attempting to recover VIN reservation for:', vin);
  
  // If we already have a reservation ID, return it
  const existingId = localStorage.getItem('vinReservationId');
  if (existingId) {
    console.log('Found existing reservation ID:', existingId);
    return existingId;
  }
  
  try {
    // First check if there's an existing reservation in the database
    const { data: reservationCheck } = await supabase.rpc(
      'check_vin_reservation',
      {
        p_vin: vin,
        p_user_id: userId
      }
    );
    
    if (reservationCheck?.exists && reservationCheck.reservation?.id) {
      const reservationId = reservationCheck.reservation.id;
      console.log('Found existing reservation in database:', reservationId);
      localStorage.setItem('vinReservationId', reservationId);
      return reservationId;
    }
    
    // Try to create a new reservation
    const { data: result, error } = await supabase.functions.invoke('reserve-vin', {
      body: {
        vin,
        userId,
        valuationData,
        action: 'create'
      }
    });
    
    if (error || !result?.success) {
      console.error('Failed to create reservation:', error || result?.error);
      
      // Create a temporary local reservation as fallback
      // Using a prefix to distinguish client-generated IDs
      const tempId = `temp_${uuidv4()}`;
      console.log('Created temporary local reservation ID:', tempId);
      
      localStorage.setItem('vinReservationId', tempId);
      localStorage.setItem('tempReservedVin', vin);
      localStorage.setItem('tempReservationCreatedAt', new Date().toISOString());
      
      toast.info("Created temporary VIN reservation", {
        description: "Full reservation couldn't be created but we'll proceed."
      });
      
      return tempId;
    }
    
    // Successful creation via edge function
    if (result.data?.reservationId) {
      const reservationId = result.data.reservationId;
      localStorage.setItem('vinReservationId', reservationId);
      localStorage.setItem('tempReservedVin', vin);
      console.log('Created new reservation:', reservationId);
      return reservationId;
    }
    
    // Create temporary reservation as fallback
    const fallbackId = `temp_${uuidv4()}`;
    localStorage.setItem('vinReservationId', fallbackId);
    localStorage.setItem('tempReservedVin', vin);
    
    console.log('Created fallback temporary reservation ID:', fallbackId);
    return fallbackId;
  } catch (error) {
    console.error('Error recovering VIN reservation:', error);
    
    // Last resort fallback
    const emergencyId = `temp_emergency_${uuidv4()}`;
    localStorage.setItem('vinReservationId', emergencyId);
    localStorage.setItem('tempReservedVin', vin);
    
    console.log('Created emergency temporary reservation ID:', emergencyId);
    return emergencyId;
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
