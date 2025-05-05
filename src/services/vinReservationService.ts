
/**
 * Client service for managing VIN reservations
 * Updated: 2025-05-05 - Enhanced error handling and automatic reservation creation
 * Updated: 2025-05-05 - Fixed to work with RLS policies
 */
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface VinReservationResult {
  success: boolean;
  data?: {
    reservationId?: string;
    expiresAt?: string;
    isNew?: boolean;
    exists?: boolean;
    wasExpired?: boolean;
    message?: string;
    reservation?: {
      id: string;
      vin: string;
      expiresAt: string;
      valuationData?: any;
      timeRemaining: number;
    };
  };
  error?: string;
}

/**
 * Creates or updates a VIN reservation
 */
export async function reserveVin(
  vin: string,
  userId: string,
  valuationData?: any
): Promise<VinReservationResult> {
  try {
    console.log('Creating VIN reservation:', { vin, userId });
    
    // First check if a reservation already exists for this VIN and user
    const { data: existingReservations, error: checkError } = await supabase
      .from('vin_reservations')
      .select('id, status, expires_at')
      .eq('vin', vin)
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();
      
    if (checkError) {
      console.warn('Error checking for existing reservations:', checkError);
      // Continue with edge function as fallback
    } else if (existingReservations) {
      console.log('Found existing reservation:', existingReservations);
      
      // Check if the reservation is still valid
      const now = new Date();
      const expiresAt = new Date(existingReservations.expires_at);
      
      if (now < expiresAt) {
        console.log('Existing reservation is still valid');
        
        // Try to update the reservation to extend its expiration
        const { data: updatedReservation, error: updateError } = await supabase
          .from('vin_reservations')
          .update({
            expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
            valuation_data: valuationData || undefined
          })
          .eq('id', existingReservations.id)
          .select('id, expires_at')
          .single();
          
        if (updateError) {
          console.warn('Error updating reservation:', updateError);
        } else {
          console.log('Updated existing reservation:', updatedReservation);
          return {
            success: true,
            data: {
              reservationId: updatedReservation.id,
              expiresAt: updatedReservation.expires_at,
              isNew: false
            }
          };
        }
      }
    }
    
    // Try to create a new reservation directly
    try {
      const { data: directReservation, error: directError } = await supabase
        .from('vin_reservations')
        .insert([
          {
            vin,
            user_id: userId, // This matches the RLS policy column name
            expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
            valuation_data: valuationData || null,
            status: 'active'
          }
        ])
        .select('id, expires_at')
        .single();
        
      if (!directError) {
        console.log('Successfully created reservation directly:', directReservation);
        return {
          success: true,
          data: {
            reservationId: directReservation.id,
            expiresAt: directReservation.expires_at,
            isNew: true
          }
        };
      } else {
        console.log('Could not create reservation directly:', directError);
        // Fall back to edge function method
      }
    } catch (directInsertError) {
      console.warn('Error with direct reservation insert:', directInsertError);
      // Fall back to edge function method
    }
    
    // Fall back to using the edge function if direct DB access fails
    const { data, error } = await supabase.functions.invoke('reserve-vin', {
      body: {
        vin,
        userId,
        valuationData,
        action: 'create'
      }
    });
    
    if (error) {
      console.error('VIN reservation error:', error);
      toast.error('Failed to reserve VIN');
      return {
        success: false,
        error: error.message
      };
    }
    
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('VIN reservation exception:', error);
    toast.error('Failed to reserve VIN');
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    };
  }
}

/**
 * Checks the status of a VIN reservation
 */
export async function checkVinReservation(
  vin: string,
  userId: string
): Promise<VinReservationResult> {
  try {
    console.log('Checking VIN reservation:', { vin, userId });
    
    // First try direct database query with RLS
    try {
      const { data: reservation, error: reservationError } = await supabase
        .from('vin_reservations')
        .select('*')
        .eq('vin', vin)
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();
        
      if (!reservationError && reservation) {
        // Check if the reservation has expired
        const now = new Date();
        const expiresAt = new Date(reservation.expires_at);
        
        if (now > expiresAt) {
          return {
            success: true,
            data: {
              exists: false,
              wasExpired: true,
              message: "Reservation has expired"
            }
          };
        }
        
        return {
          success: true,
          data: {
            exists: true,
            reservation: {
              id: reservation.id,
              vin: reservation.vin,
              expiresAt: reservation.expires_at,
              valuationData: reservation.valuation_data,
              timeRemaining: Math.floor((expiresAt.getTime() - now.getTime()) / 1000) // in seconds
            }
          }
        };
      }
    } catch (directQueryError) {
      console.warn('Error with direct reservation query:', directQueryError);
      // Fall back to edge function
    }
    
    // Fall back to edge function
    const { data, error } = await supabase.functions.invoke('reserve-vin', {
      body: {
        vin,
        userId,
        action: 'check'
      }
    });
    
    if (error) {
      console.error('VIN check error:', error);
      return {
        success: false,
        error: error.message
      };
    }
    
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('VIN check exception:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    };
  }
}

/**
 * Extends the expiration time of a VIN reservation
 */
export async function extendVinReservation(
  vin: string,
  userId: string
): Promise<VinReservationResult> {
  try {
    console.log('Extending VIN reservation:', { vin, userId });
    
    // Try direct update first
    try {
      const newExpiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes from now
      
      const { data: updatedReservation, error: updateError } = await supabase
        .from('vin_reservations')
        .update({ expires_at: newExpiresAt })
        .eq('vin', vin)
        .eq('user_id', userId)
        .eq('status', 'active')
        .select('id, expires_at')
        .single();
        
      if (!updateError) {
        toast.success('Reservation extended');
        return {
          success: true,
          data: {
            reservationId: updatedReservation.id,
            expiresAt: updatedReservation.expires_at
          }
        };
      } else {
        console.warn('Error with direct reservation update:', updateError);
      }
    } catch (directUpdateError) {
      console.warn('Exception with direct reservation update:', directUpdateError);
    }
    
    // Fall back to edge function
    const { data, error } = await supabase.functions.invoke('reserve-vin', {
      body: {
        vin,
        userId,
        action: 'extend'
      }
    });
    
    if (error) {
      console.error('VIN extension error:', error);
      toast.error('Failed to extend reservation');
      return {
        success: false,
        error: error.message
      };
    }
    
    toast.success('Reservation extended');
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('VIN extension exception:', error);
    toast.error('Failed to extend reservation');
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    };
  }
}

/**
 * Cancels a VIN reservation
 */
export async function cancelVinReservation(
  vin: string,
  userId: string
): Promise<VinReservationResult> {
  try {
    console.log('Cancelling VIN reservation:', { vin, userId });
    
    // Try direct update first
    try {
      const { data: cancelledReservation, error: cancelError } = await supabase
        .from('vin_reservations')
        .update({ status: 'cancelled' })
        .eq('vin', vin)
        .eq('user_id', userId)
        .eq('status', 'active')
        .select('id')
        .single();
        
      if (!cancelError) {
        toast.success('Reservation cancelled');
        return {
          success: true,
          data: {
            reservationId: cancelledReservation.id,
            message: "Reservation cancelled successfully"
          }
        };
      } else {
        console.warn('Error with direct reservation cancellation:', cancelError);
      }
    } catch (directCancelError) {
      console.warn('Exception with direct reservation cancellation:', directCancelError);
    }
    
    // Fall back to edge function
    const { data, error } = await supabase.functions.invoke('reserve-vin', {
      body: {
        vin,
        userId,
        action: 'cancel'
      }
    });
    
    if (error) {
      console.error('VIN cancellation error:', error);
      toast.error('Failed to cancel reservation');
      return {
        success: false,
        error: error.message
      };
    }
    
    toast.success('Reservation cancelled');
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('VIN cancellation exception:', error);
    toast.error('Failed to cancel reservation');
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    };
  }
}

/**
 * Create a hook for VIN reservation with auto-extension
 * This can be expanded later if needed
 */
export function useVinReservation() {
  return {
    reserveVin,
    checkVinReservation,
    extendVinReservation,
    cancelVinReservation
  };
}
