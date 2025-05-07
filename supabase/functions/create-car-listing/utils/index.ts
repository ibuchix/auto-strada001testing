
/**
 * Utility exports for create-car-listing
 * Created: 2025-05-06 - Created new local implementation instead of external dependency
 * Updated: 2025-05-08 - Added new validation functions
 */

// Export all utility functions
export * from "./cors.ts";
export * from "./logging.ts";
export * from "./validation.ts";
export * from "./response.ts";
export * from "./seller.ts";
export * from "./listing.ts";

// Export new functions
export function createRequestId(): string {
  return crypto.randomUUID?.() || Date.now().toString();
}

/**
 * Validates if a VIN reservation is valid for this request
 * 
 * @param supabase Supabase client
 * @param userId User ID
 * @param vin VIN
 * @param reservationId Optional reservation ID
 * @param requestId Request ID for tracking
 * @returns Validation result with success flag
 */
export async function validateVinReservation(
  supabase: SupabaseClient,
  userId: string,
  vin: string,
  reservationId?: string,
  requestId: string = "unspecified"
): Promise<{ valid: boolean; error?: string }> {
  try {
    // Skip validation for special temporary reservations
    if (reservationId && 
        (reservationId.startsWith('temp_') || 
         reservationId.includes('temporary') || 
         reservationId.includes('client_gen'))) {
      
      logOperation('using_temporary_reservation', { 
        requestId, 
        userId, 
        vin, 
        reservationId
      });
      
      return { valid: true };
    }
    
    // If no reservation ID provided, check if VIN can be directly used
    if (!reservationId) {
      logOperation('no_reservation_provided', { 
        requestId, 
        userId, 
        vin,
        check: 'direct_availability'
      });
      
      // Check if VIN is available for this user
      try {
        const { data: availCheck, error: availError } = await supabase.rpc(
          'is_vin_available_for_user',
          { p_vin: vin, p_user_id: userId }
        );
        
        if (!availError && availCheck === true) {
          logOperation('vin_available_for_user', { 
            requestId, 
            userId, 
            vin
          });
          
          return { valid: true };
        } else if (availError) {
          logOperation('vin_availability_check_error', { 
            requestId, 
            userId, 
            vin,
            error: availError.message
          }, 'warn');
          
          // Fall back to more lenient validation with direct query
          const { count, error: countError } = await supabase
            .from('cars')
            .select('id', { count: 'exact', head: true })
            .eq('vin', vin)
            .eq('is_draft', false);
            
          if (!countError && count === 0) {
            return { valid: true };
          }
        }
      } catch (e) {
        logOperation('vin_availability_check_exception', { 
          requestId, 
          userId, 
          vin,
          error: (e as Error).message
        }, 'warn');
      }
      
      return { 
        valid: false, 
        error: "No valid VIN reservation provided and VIN is not available" 
      };
    }
    
    // Verify the reservation
    const { data: reservation, error } = await supabase
      .from('vin_reservations')
      .select('*')
      .eq('id', reservationId)
      .single();
      
    if (error) {
      logOperation('reservation_fetch_error', { 
        requestId, 
        userId, 
        vin,
        reservationId,
        error: error.message
      }, 'error');
      
      return { 
        valid: false, 
        error: `Failed to verify reservation: ${error.message}` 
      };
    }
    
    if (!reservation) {
      return { 
        valid: false, 
        error: "Reservation not found" 
      };
    }
    
    // Check if reservation is active and not expired
    if (reservation.status !== 'active') {
      return { 
        valid: false, 
        error: `Reservation is not active (status: ${reservation.status})` 
      };
    }
    
    const expiresAt = new Date(reservation.expires_at);
    if (expiresAt < new Date()) {
      return { 
        valid: false, 
        error: "Reservation has expired" 
      };
    }
    
    // Check if reservation belongs to user
    if (reservation.user_id !== userId) {
      // For security, log this potential security issue
      logOperation('reservation_user_mismatch', { 
        requestId, 
        userId, 
        vin,
        reservationUserId: reservation.user_id
      }, 'warn');
      
      return { 
        valid: false, 
        error: "Reservation does not belong to current user" 
      };
    }
    
    // Check if reservation VIN matches
    if (reservation.vin !== vin) {
      return { 
        valid: false, 
        error: "Reservation VIN does not match requested VIN" 
      };
    }
    
    // All checks passed
    return { valid: true };
  } catch (error) {
    logOperation('reservation_validation_error', { 
      requestId, 
      userId, 
      vin,
      error: (error as Error).message
    }, 'error');
    
    return { 
      valid: false, 
      error: `Error validating reservation: ${(error as Error).message}` 
    };
  }
}

/**
 * Marks a VIN reservation as used
 * 
 * @param supabase Supabase client
 * @param reservationId Reservation ID
 * @param requestId Request ID for tracking
 */
export async function markReservationAsUsed(
  supabase: SupabaseClient,
  reservationId: string,
  requestId: string = "unspecified"
): Promise<void> {
  try {
    // Skip for temporary reservations
    if (reservationId.startsWith('temp_') || 
        reservationId.includes('temporary') || 
        reservationId.includes('client_gen')) {
      return;
    }
    
    const { error } = await supabase
      .from('vin_reservations')
      .update({ status: 'used' })
      .eq('id', reservationId);
      
    if (error) {
      logOperation('mark_reservation_used_error', { 
        requestId, 
        reservationId,
        error: error.message
      }, 'warn');
    }
  } catch (error) {
    logOperation('mark_reservation_exception', { 
      requestId, 
      reservationId,
      error: (error as Error).message
    }, 'error');
  }
}

// Import from types
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
