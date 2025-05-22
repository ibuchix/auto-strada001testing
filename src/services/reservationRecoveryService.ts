
/**
 * Reservation Recovery Service
 * Updated: 2025-05-23 - Fixed TypeScript compatibility with Supabase Json types
 * Updated: 2025-05-24 - Added recoverVinReservation function
 */

import { supabase } from '@/integrations/supabase/client';
import { safeJsonCast } from '@/utils/supabaseTypeUtils';

/**
 * Interface for reservation data
 */
interface ReservationData {
  id: string;
  vin: string;
  valuation_data?: any;
  expires_at?: string;
  status?: string;
  user_id?: string;
}

/**
 * Interface for reservation response
 */
interface ReservationResponse {
  success: boolean;
  reservationId?: string;
  expiresAt?: string;
  isNew?: boolean;
  error?: string;
}

/**
 * Creates a VIN reservation for the current user
 */
export async function createVinReservation(vin: string, valuationData?: any): Promise<ReservationResponse> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('Cannot create reservation: No authenticated user');
      return { 
        success: false, 
        error: 'Authentication required'
      };
    }
    
    // Call the RPC function
    const { data, error } = await supabase.rpc('create_vin_reservation', {
      p_vin: vin,
      p_user_id: user.id,
      p_valuation_data: valuationData || null,
      p_duration_minutes: 30
    });
    
    if (error) {
      console.error('RPC error creating VIN reservation:', error);
      return {
        success: false,
        error: error.message
      };
    }
    
    // Convert response with type safety
    const typedResponse = safeJsonCast<ReservationResponse>(data);
    
    if (typedResponse.success) {
      console.log('Reservation created/updated successfully:', typedResponse.reservationId);
      return typedResponse;
    } else {
      console.error('Failed to create/update reservation:', typedResponse.error);
      return typedResponse;
    }
  } catch (error: any) {
    console.error('Exception creating VIN reservation:', error);
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
}

/**
 * Checks if a reservation exists for the current user and VIN
 */
export async function checkVinReservation(vin: string): Promise<ReservationResponse> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('Cannot check reservation: No authenticated user');
      return { 
        success: false, 
        error: 'Authentication required'
      };
    }
    
    // Call the RPC function
    const { data, error } = await supabase.rpc('check_vin_reservation', {
      p_vin: vin,
      p_user_id: user.id
    });
    
    if (error) {
      console.error('RPC error checking VIN reservation:', error);
      return {
        success: false,
        error: error.message
      };
    }
    
    // Convert the response with type safety
    const typedResponse = safeJsonCast<{exists: boolean, reservation?: {id: string, vin: string, expires_at: string}, message?: string}>(data);
    
    if (typedResponse.exists && typedResponse.reservation) {
      return {
        success: true,
        reservationId: typedResponse.reservation.id,
        expiresAt: typedResponse.reservation.expires_at
      };
    } else {
      return {
        success: false,
        error: typedResponse.message || 'No reservation found'
      };
    }
  } catch (error: any) {
    console.error('Exception checking VIN reservation:', error);
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
}

/**
 * Recover an existing VIN reservation or create a new one if none exists
 */
export async function recoverVinReservation(vin: string, userId: string, valuationData?: any): Promise<string | null> {
  try {
    console.log('Attempting to recover VIN reservation:', { vin, userId });
    
    // First check if a reservation already exists
    const { data: existingReservation, error: checkError } = await supabase
      .from('vin_reservations')
      .select('id, status, expires_at')
      .eq('vin', vin)
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();
    
    if (checkError) {
      console.error('Error checking existing reservation:', checkError);
      return null;
    }
    
    // If active reservation exists and isn't expired, return its ID
    if (existingReservation && 
        existingReservation.status === 'active' && 
        new Date(existingReservation.expires_at) > new Date()) {
      console.log('Existing active reservation found:', existingReservation.id);
      return existingReservation.id;
    }
    
    // Create a new reservation
    const { data, error } = await supabase.rpc('create_vin_reservation', {
      p_vin: vin,
      p_user_id: userId,
      p_valuation_data: valuationData || null,
      p_duration_minutes: 30
    });
    
    if (error) {
      console.error('RPC error creating VIN reservation:', error);
      return null;
    }
    
    const response = safeJsonCast<ReservationResponse>(data);
    
    if (response.success && response.reservationId) {
      console.log('New reservation created:', response.reservationId);
      // Store in localStorage for easier access
      localStorage.setItem('vinReservationId', response.reservationId);
      localStorage.setItem('tempReservedVin', vin);
      localStorage.setItem('tempReservationCreatedAt', new Date().toISOString());
      
      return response.reservationId;
    } else {
      console.error('Failed to create new reservation:', response.error);
      return null;
    }
  } catch (error: any) {
    console.error('Exception in recoverVinReservation:', error);
    return null;
  }
}
