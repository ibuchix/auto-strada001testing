
/**
 * Client service for managing VIN reservations
 * Updated: 2025-05-06 - Fixed authentication and error handling issues
 * Updated: 2025-05-06 - Ensured proper JWT token passing to edge function
 * Updated: 2025-05-08 - Fixed error handling for undefined values
 * Updated: 2025-05-08 - Added robust response validation
 * Updated: 2025-05-08 - Enhanced error logging and user feedback
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
 * Safely extract error message from any error type
 */
function safeGetErrorMessage(error: any): string {
  if (!error) return 'Unknown error occurred';
  
  if (typeof error === 'string') return error;
  
  if (error instanceof Error) return error.message;
  
  if (typeof error === 'object') {
    // Check common error object patterns
    if (error.message) return error.message;
    if (error.error) return typeof error.error === 'string' ? error.error : JSON.stringify(error.error);
    if (error.statusText) return error.statusText;
  }
  
  // Fallback to stringifying the error
  try {
    return JSON.stringify(error);
  } catch (e) {
    return 'Unrecognized error format';
  }
}

/**
 * Validate the response from the edge function
 */
function validateResponse(response: any): VinReservationResult {
  // Default error result
  const errorResult: VinReservationResult = {
    success: false,
    error: 'Invalid response format'
  };
  
  // Check if response exists
  if (!response) return errorResult;
  
  // If response has an explicit success flag, use it
  if (typeof response.success === 'boolean') {
    // Already in correct format
    if (response.success === false && !response.error) {
      response.error = 'Operation failed without specific error message';
    }
    return response;
  }
  
  // If response has data property, wrap it properly
  if (response.data) {
    return {
      success: true,
      data: response.data
    };
  }
  
  // If response has error property, wrap it properly
  if (response.error) {
    return {
      success: false,
      error: safeGetErrorMessage(response.error)
    };
  }
  
  // If response itself might be the data
  if (typeof response === 'object' && response !== null) {
    // Check if it looks like a reservation result
    if (response.reservationId || response.reservation) {
      return {
        success: true,
        data: response
      };
    }
  }
  
  // Couldn't interpret the response format
  console.warn('Unrecognized response format:', response);
  return errorResult;
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
        error: safeGetErrorMessage(error) 
      };
    }
    
    // Validate and normalize the response
    const validatedResponse = validateResponse(data);
    
    // If response indicates failure but no error specified
    if (!validatedResponse.success && !validatedResponse.error) {
      validatedResponse.error = 'Operation failed without details';
    }
    
    // Log the response format for debugging
    console.log('VIN reservation response format:', {
      success: validatedResponse.success,
      hasData: !!validatedResponse.data,
      hasError: !!validatedResponse.error,
      reservationId: validatedResponse.data?.reservationId
    });
    
    return validatedResponse;
  } catch (error) {
    console.error('VIN reservation exception:', error);
    toast.error('Failed to reserve VIN');
    return {
      success: false,
      error: safeGetErrorMessage(error)
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
        error: safeGetErrorMessage(error)
      };
    }
    
    return validateResponse(data);
  } catch (error) {
    console.error('VIN check exception:', error);
    return {
      success: false,
      error: safeGetErrorMessage(error)
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
    
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.warn('No active session found for VIN extension');
      return {
        success: false,
        error: 'Authentication required to extend reservation'
      };
    }
    
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
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });
    
    if (error) {
      console.error('VIN extension error:', error);
      toast.error('Failed to extend reservation');
      return {
        success: false,
        error: safeGetErrorMessage(error)
      };
    }
    
    toast.success('Reservation extended');
    return validateResponse(data);
  } catch (error) {
    console.error('VIN extension exception:', error);
    toast.error('Failed to extend reservation');
    return {
      success: false,
      error: safeGetErrorMessage(error)
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
    
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.warn('No active session found for VIN cancellation');
      return {
        success: false,
        error: 'Authentication required to cancel reservation'
      };
    }
    
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
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });
    
    if (error) {
      console.error('VIN cancellation error:', error);
      toast.error('Failed to cancel reservation');
      return {
        success: false,
        error: safeGetErrorMessage(error)
      };
    }
    
    toast.success('Reservation cancelled');
    return validateResponse(data);
  } catch (error) {
    console.error('VIN cancellation exception:', error);
    toast.error('Failed to cancel reservation');
    return {
      success: false,
      error: safeGetErrorMessage(error)
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
