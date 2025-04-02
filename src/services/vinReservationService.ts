
/**
 * Client service for managing VIN reservations
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
