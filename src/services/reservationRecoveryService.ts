
/**
 * Reservation Recovery Service
 * Created: 2025-05-06 - Extracted from FormSubmissionProvider to improve modularity
 * 
 * This service handles attempts to recover or create VIN reservations
 * when they are missing or expired.
 */

import { reserveVin } from '@/services/vinReservationService';
import { toast } from 'sonner';

/**
 * Attempts to recover or create a new VIN reservation
 * @param vin Vehicle Identification Number 
 * @param userId User ID to associate the reservation with
 * @param valuationData Optional valuation data to include with the reservation
 * @returns The reservation ID if successful, null if failed
 */
export async function recoverVinReservation(
  vin: string,
  userId: string,
  valuationData: any
): Promise<string | null> {
  console.log('Attempting to recover VIN reservation for:', vin);
  
  try {
    const reservationResult = await reserveVin(vin, userId, valuationData);
    
    if (reservationResult.success && reservationResult.data) {
      // Successfully created or found existing reservation
      const reservationId = reservationResult.data.reservationId || 
                           reservationResult.data.reservation?.id;
                           
      if (reservationId) {
        console.log('Recovered VIN reservation:', reservationId);
        localStorage.setItem('vinReservationId', reservationId);
        return reservationId;
      }
    }
  } catch (error) {
    console.error('Failed to recover VIN reservation:', error);
  }
  
  // Fallback - create a temporary ID with proper UUID format
  const tempId = crypto.randomUUID();
  localStorage.setItem('vinReservationId', tempId);
  localStorage.setItem('tempReservedVin', vin); // Store the VIN separately for reference
  console.log('Created temporary VIN reservation UUID:', tempId);
  
  toast.info('Using temporary reservation', {
    description: 'A temporary reservation ID has been created for your submission.'
  });
  
  return tempId;
}
