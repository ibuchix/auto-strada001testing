
/**
 * Reservation Recovery Service
 * Created: 2025-05-17 - To help handle VIN reservation issues and recover from errors
 * 
 * This service handles creation, verification, and recovery of VIN reservations
 * to prevent issues with car listing creation.
 */

import { v4 as uuidv4 } from 'uuid';
import { supabase } from "@/integrations/supabase/client";

/**
 * Creates a temporary VIN reservation ID in localStorage
 * Used as a fallback when database reservation fails
 * 
 * @param vin The VIN to reserve
 * @returns The temporary reservation ID
 */
const createTemporaryReservation = (vin: string): string => {
  // Generate a temporary ID with a UUID for uniqueness
  const tempReservationId = `temp_${uuidv4()}`;
  
  // Store in localStorage
  localStorage.setItem('vinReservationId', tempReservationId);
  localStorage.setItem('tempReservedVin', vin);
  localStorage.setItem('tempReservationCreatedAt', new Date().toISOString());
  
  console.log(`Created temporary VIN reservation: ${tempReservationId} for VIN: ${vin}`);
  
  return tempReservationId;
};

/**
 * Creates a database VIN reservation
 * 
 * @param vin The VIN to reserve
 * @param userId The user ID
 * @param valuationData Optional valuation data to associate
 * @returns The reservation ID or null if failed
 */
const createDatabaseReservation = async (
  vin: string,
  userId: string,
  valuationData?: any
): Promise<string | null> => {
  try {
    console.log('Creating database VIN reservation for:', vin);
    
    const { data, error } = await supabase.rpc(
      'create_vin_reservation',
      {
        p_vin: vin,
        p_user_id: userId,
        p_valuation_data: valuationData || null,
        p_duration_minutes: 60 // 1 hour reservation
      }
    );
    
    if (error) {
      console.error('Error creating VIN reservation:', error);
      return null;
    }
    
    if (!data?.success) {
      console.error('VIN reservation failed:', data);
      return null;
    }
    
    // Store in localStorage
    localStorage.setItem('vinReservationId', data.reservationId);
    
    console.log(`Created database VIN reservation: ${data.reservationId}`);
    
    return data.reservationId;
  } catch (error) {
    console.error('Exception creating VIN reservation:', error);
    return null;
  }
};

/**
 * Checks if a VIN is available for reservation
 * 
 * @param vin The VIN to check
 * @param userId The user ID
 * @returns True if available, false otherwise
 */
const checkVinAvailability = async (vin: string, userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc(
      'is_vin_available_for_user',
      {
        p_vin: vin,
        p_user_id: userId
      }
    );
    
    if (error) {
      console.error('Error checking VIN availability:', error);
      return true; // Default to true on error
    }
    
    return data === true;
  } catch (error) {
    console.error('Exception checking VIN availability:', error);
    return true; // Default to true on error
  }
};

/**
 * Recovers or creates a VIN reservation
 * Uses multiple strategies to ensure a reservation exists
 * 
 * @param vin The VIN to reserve
 * @param userId The user ID
 * @param valuationData Optional valuation data
 * @returns The reservation ID or null if all attempts fail
 */
export const recoverVinReservation = async (
  vin: string,
  userId: string,
  valuationData?: any
): Promise<string | null> => {
  // Check if we already have a reservation
  const existingReservationId = localStorage.getItem('vinReservationId');
  const existingVin = localStorage.getItem('tempReservedVin');
  
  if (existingReservationId && existingVin === vin) {
    console.log(`Using existing VIN reservation: ${existingReservationId}`);
    return existingReservationId;
  }
  
  // Check if VIN is available for this user
  const isAvailable = await checkVinAvailability(vin, userId);
  
  if (!isAvailable) {
    console.error('VIN is not available for reservation by this user');
    return null;
  }
  
  // Try to create a database reservation first
  const dbReservationId = await createDatabaseReservation(vin, userId, valuationData);
  
  if (dbReservationId) {
    return dbReservationId;
  }
  
  // Fall back to a temporary reservation
  return createTemporaryReservation(vin);
};
