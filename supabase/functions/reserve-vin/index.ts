
/**
 * Edge function for VIN reservation
 * 
 * This function handles:
 * - Creating new VIN reservations
 * - Checking reservation status
 * - Updating existing reservations
 * - Handling expiration logic
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { corsHeaders } from "../_shared/cors.ts";
import { logOperation } from "../_shared/logging.ts";
import { formatSuccessResponse, formatErrorResponse } from "../_shared/response-formatter.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";

// Duration that a VIN reservation is valid for
const RESERVATION_DURATION_MINUTES = 30;

// Validation schema for input
interface ReserveVinRequest {
  vin: string;
  userId: string;
  valuationData?: Record<string, any>;
  action?: 'create' | 'check' | 'extend' | 'cancel';
}

/**
 * Validates the incoming request data
 */
function validateRequest(data: any): { valid: boolean; error?: string } {
  if (!data) {
    return { valid: false, error: "Request body is required" };
  }

  if (!data.vin || typeof data.vin !== 'string' || data.vin.length < 10) {
    return { valid: false, error: "Valid VIN is required" };
  }

  if (!data.userId) {
    return { valid: false, error: "User ID is required" };
  }

  return { valid: true };
}

/**
 * Creates a new VIN reservation
 */
async function createReservation(
  supabase: ReturnType<typeof createClient>, 
  vin: string, 
  userId: string, 
  valuationData?: Record<string, any>
): Promise<{ success: boolean; data?: any; error?: string }> {
  const requestId = crypto.randomUUID();
  logOperation('create_reservation_start', { requestId, vin, userId });

  try {
    // Check if VIN is available using the database function
    const { data: isAvailable, error: availabilityError } = await supabase.rpc(
      'is_vin_available',
      { p_vin: vin }
    );

    if (availabilityError) {
      logOperation('availability_check_error', { requestId, error: availabilityError.message }, 'error');
      return { 
        success: false, 
        error: `Error checking VIN availability: ${availabilityError.message}`
      };
    }

    if (!isAvailable) {
      logOperation('vin_unavailable', { requestId, vin }, 'warn');
      return { 
        success: false, 
        error: "This VIN is already in use or reserved by another user"
      };
    }

    // Calculate expiration time
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + RESERVATION_DURATION_MINUTES);

    // First check if user already has a reservation for this VIN
    const { data: existingReservation } = await supabase
      .from('vin_reservations')
      .select('id, status')
      .eq('vin', vin)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingReservation) {
      // Update existing reservation
      const { data, error } = await supabase
        .from('vin_reservations')
        .update({
          expires_at: expiresAt.toISOString(),
          status: 'active',
          valuation_data: valuationData || existingReservation.valuation_data
        })
        .eq('id', existingReservation.id)
        .select('id, expires_at')
        .single();

      if (error) {
        logOperation('update_reservation_error', { 
          requestId, 
          error: error.message 
        }, 'error');
        
        return { 
          success: false, 
          error: `Failed to update reservation: ${error.message}`
        };
      }

      logOperation('update_reservation_success', { 
        requestId, 
        reservationId: data.id 
      });

      return {
        success: true,
        data: {
          reservationId: data.id,
          expiresAt: data.expires_at,
          isNew: false
        }
      };
    }

    // Create new reservation
    const { data: reservation, error: reservationError } = await supabase
      .from('vin_reservations')
      .insert([
        {
          vin,
          user_id: userId,
          expires_at: expiresAt.toISOString(),
          valuation_data: valuationData,
          status: 'active'
        }
      ])
      .select('id, expires_at')
      .single();

    if (reservationError) {
      logOperation('create_reservation_error', { 
        requestId, 
        error: reservationError.message 
      }, 'error');
      
      return { 
        success: false, 
        error: `Failed to create reservation: ${reservationError.message}`
      };
    }

    logOperation('create_reservation_success', { 
      requestId, 
      reservationId: reservation.id 
    });

    return {
      success: true,
      data: {
        reservationId: reservation.id,
        expiresAt: reservation.expires_at,
        isNew: true
      }
    };
  } catch (error) {
    logOperation('create_reservation_exception', { 
      requestId, 
      error: error.message 
    }, 'error');
    
    return { 
      success: false, 
      error: `Unexpected error: ${error.message}`
    };
  }
}

/**
 * Checks the status of a VIN reservation
 */
async function checkReservation(
  supabase: ReturnType<typeof createClient>, 
  vin: string, 
  userId: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  const requestId = crypto.randomUUID();
  logOperation('check_reservation_start', { requestId, vin, userId });

  try {
    // Get reservation
    const { data: reservation, error } = await supabase
      .from('vin_reservations')
      .select('*')
      .eq('vin', vin)
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (error) {
      logOperation('check_reservation_error', { 
        requestId, 
        error: error.message 
      }, 'error');
      
      return { 
        success: false, 
        error: `Failed to check reservation: ${error.message}`
      };
    }

    if (!reservation) {
      return {
        success: true,
        data: {
          exists: false,
          message: "No active reservation found for this VIN and user"
        }
      };
    }

    // Check if reservation is expired
    const now = new Date();
    const expiresAt = new Date(reservation.expires_at);
    const isExpired = now > expiresAt;

    if (isExpired) {
      // Mark as expired
      await supabase
        .from('vin_reservations')
        .update({ status: 'expired' })
        .eq('id', reservation.id);

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
  } catch (error) {
    logOperation('check_reservation_exception', { 
      requestId, 
      error: error.message 
    }, 'error');
    
    return { 
      success: false, 
      error: `Unexpected error: ${error.message}`
    };
  }
}

/**
 * Extends a VIN reservation's expiration time
 */
async function extendReservation(
  supabase: ReturnType<typeof createClient>, 
  vin: string, 
  userId: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  const requestId = crypto.randomUUID();
  logOperation('extend_reservation_start', { requestId, vin, userId });

  try {
    // Calculate new expiration time
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + RESERVATION_DURATION_MINUTES);

    // Update reservation
    const { data, error } = await supabase
      .from('vin_reservations')
      .update({
        expires_at: expiresAt.toISOString(),
        status: 'active'
      })
      .eq('vin', vin)
      .eq('user_id', userId)
      .select('id, expires_at')
      .single();

    if (error) {
      logOperation('extend_reservation_error', { 
        requestId, 
        error: error.message 
      }, 'error');
      
      return { 
        success: false, 
        error: `Failed to extend reservation: ${error.message}`
      };
    }

    logOperation('extend_reservation_success', { 
      requestId, 
      reservationId: data.id 
    });

    return {
      success: true,
      data: {
        reservationId: data.id,
        expiresAt: data.expires_at
      }
    };
  } catch (error) {
    logOperation('extend_reservation_exception', { 
      requestId, 
      error: error.message 
    }, 'error');
    
    return { 
      success: false, 
      error: `Unexpected error: ${error.message}`
    };
  }
}

/**
 * Cancels a VIN reservation
 */
async function cancelReservation(
  supabase: ReturnType<typeof createClient>, 
  vin: string, 
  userId: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  const requestId = crypto.randomUUID();
  logOperation('cancel_reservation_start', { requestId, vin, userId });

  try {
    // Update reservation status
    const { data, error } = await supabase
      .from('vin_reservations')
      .update({ status: 'cancelled' })
      .eq('vin', vin)
      .eq('user_id', userId)
      .eq('status', 'active')
      .select('id')
      .single();

    if (error) {
      logOperation('cancel_reservation_error', { 
        requestId, 
        error: error.message 
      }, 'error');
      
      return { 
        success: false, 
        error: `Failed to cancel reservation: ${error.message}`
      };
    }

    logOperation('cancel_reservation_success', { 
      requestId, 
      reservationId: data.id 
    });

    return {
      success: true,
      data: {
        reservationId: data.id,
        message: "Reservation cancelled successfully"
      }
    };
  } catch (error) {
    logOperation('cancel_reservation_exception', { 
      requestId, 
      error: error.message 
    }, 'error');
    
    return { 
      success: false, 
      error: `Unexpected error: ${error.message}`
    };
  }
}

/**
 * Cleans up expired reservations
 */
async function cleanupExpiredReservations(
  supabase: ReturnType<typeof createClient>
): Promise<{ count: number }> {
  try {
    const { data, error } = await supabase.rpc('cleanup_expired_vin_reservations');
    
    if (error) {
      console.error('Failed to cleanup expired reservations:', error);
      return { count: 0 };
    }
    
    return { count: data };
  } catch (error) {
    console.error('Exception during cleanup:', error);
    return { count: 0 };
  }
}

// Main handler
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  const requestId = crypto.randomUUID();
  logOperation('reserve_vin_request', { requestId, method: req.method });

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Clean up any expired reservations
    await cleanupExpiredReservations(supabase);
    
    // Parse the request
    const data: ReserveVinRequest = await req.json();
    
    // Validate request
    const validation = validateRequest(data);
    if (!validation.valid) {
      return formatErrorResponse(validation.error || "Invalid request", 400);
    }
    
    const { vin, userId, valuationData, action = 'create' } = data;
    
    let result;
    
    // Process based on action
    switch (action) {
      case 'check':
        result = await checkReservation(supabase, vin, userId);
        break;
      
      case 'extend':
        result = await extendReservation(supabase, vin, userId);
        break;
      
      case 'cancel':
        result = await cancelReservation(supabase, vin, userId);
        break;
      
      case 'create':
      default:
        result = await createReservation(supabase, vin, userId, valuationData);
        break;
    }
    
    if (!result.success) {
      return formatErrorResponse(result.error || "Operation failed", 400);
    }
    
    return formatSuccessResponse(result.data);
    
  } catch (err) {
    logOperation('reserve_vin_exception', { 
      requestId, 
      error: err.message,
      stack: err.stack
    }, 'error');
    
    return formatErrorResponse(`Error processing request: ${err.message}`, 500);
  }
});
