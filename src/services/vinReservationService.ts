/**
 * Client service for managing VIN reservations
 * Updated: 2025-05-06 - Fixed authentication and error handling issues
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
    
    // First check if user is logged in
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.warn('No active session found for VIN reservation');
      return {
        success: false,
        error: 'Authentication required to reserve VIN'
      };
    }

    // Use security definer function through edge function
    const { data, error } = await supabase.functions.invoke('reserve-vin', {
      body: {
        vin,
        userId,
        valuationData,
        action: 'create'
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`
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
    
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.warn('No active session found for VIN check');
      return {
        success: false,
        error: 'Authentication required to check reservation'
      };
    }

    // Use security definer function through edge function
    const { data, error } = await supabase.functions.invoke('reserve-vin', {
      body: {
        vin,
        userId,
        action: 'check'
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`
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
