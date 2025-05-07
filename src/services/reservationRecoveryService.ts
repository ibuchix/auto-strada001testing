
/**
 * Reservation Recovery Service
 * Created: 2025-05-06 - Extracted from form submission provider to handle VIN reservation recovery
 * Updated: 2025-05-08 - Enhanced to handle more edge cases and improve reliability
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
    const { data: reservationCheck, error } = await supabase.rpc(
      'check_vin_reservation',
      {
        p_vin: vin,
        p_user_id: userId
      }
    );
    
    // Handle potential RPC error/missing function
    if (error && error.message && error.message.includes('does not exist')) {
      // Fall back to direct query if RPC doesn't exist
      console.log('RPC check_vin_reservation not available, falling back to direct query');
      const { data: directCheck } = await supabase
        .from('vin_reservations')
        .select('id')
        .eq('vin', vin)
        .eq('user_id', userId)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();
      
      if (directCheck) {
        const reservationId = directCheck.id;
        console.log('Found existing reservation in database via direct query:', reservationId);
        localStorage.setItem('vinReservationId', reservationId);
        return reservationId;
      }
    } else if (!error && reservationCheck?.exists && reservationCheck.reservation?.id) {
      const reservationId = reservationCheck.reservation.id;
      console.log('Found existing reservation in database via RPC:', reservationId);
      localStorage.setItem('vinReservationId', reservationId);
      return reservationId;
    }
    
    // Try to create a new reservation
    const { data: result, error: createError } = await supabase.functions.invoke('reserve-vin', {
      body: {
        vin,
        userId,
        valuationData,
        action: 'create'
      }
    });
    
    if (createError || !result?.success) {
      console.error('Failed to create reservation:', createError || result?.error);
      
      // Try direct insert as a fallback
      try {
        const { data: directInsert, error: insertError } = await supabase
          .from('vin_reservations')
          .insert({
            vin,
            user_id: userId,
            valuation_data: valuationData,
            status: 'active',
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
          })
          .select('id')
          .single();
          
        if (!insertError && directInsert?.id) {
          const reservationId = directInsert.id;
          console.log('Created reservation via direct insert:', reservationId);
          localStorage.setItem('vinReservationId', reservationId);
          return reservationId;
        }
        
        if (insertError) {
          console.error('Direct insert failed:', insertError);
        }
      } catch (directError) {
        console.error('Error with direct insert:', directError);
      }
      
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
