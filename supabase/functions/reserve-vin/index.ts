
/**
 * Edge function for VIN reservation
 * Updated: 2025-05-06 - Fixed authentication issues and permissions
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseClient } from "../_shared/client.ts";
import { 
  corsHeaders, 
  handleCorsOptions, 
  logOperation, 
  formatSuccessResponse, 
  formatErrorResponse,
  createRequestId
} from "https://raw.githubusercontent.com/ibuchix/auto-strada001testing/main/supabase/shared-utils/mod.ts";

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

// Main handler
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return handleCorsOptions();
  }

  const requestId = crypto.randomUUID();
  logOperation('reserve_vin_request', { requestId, method: req.method });

  try {
    // Use the shared client with service role key
    const supabase = getSupabaseClient();
    
    // Clean up any expired reservations
    await supabase.rpc('cleanup_expired_vin_reservations');
    
    // Parse the request
    const data: ReserveVinRequest = await req.json();
    
    // Validate request
    const validation = validateRequest(data);
    if (!validation.valid) {
      return formatErrorResponse(validation.error || "Invalid request", 400);
    }
    
    const { vin, userId, valuationData, action = 'create' } = data;
    
    // Process based on action using security definer functions
    let result: any;
    
    switch (action) {
      case 'check': {
        const { data: checkResult, error: checkError } = await supabase.rpc(
          'check_vin_reservation',
          { p_vin: vin, p_user_id: userId }
        );
        
        if (checkError) {
          logOperation('check_reservation_error', { requestId, error: checkError.message }, 'error');
          return formatErrorResponse(`Failed to check reservation: ${checkError.message}`, 400);
        }
        
        result = checkResult;
        break;
      }
      
      case 'extend': {
        const { data: extendResult, error: extendError } = await supabase.rpc(
          'extend_vin_reservation',
          { p_vin: vin, p_user_id: userId }
        );
        
        if (extendError) {
          logOperation('extend_reservation_error', { requestId, error: extendError.message }, 'error');
          return formatErrorResponse(`Failed to extend reservation: ${extendError.message}`, 400);
        }
        
        result = extendResult;
        break;
      }
      
      case 'cancel': {
        const { data: cancelResult, error: cancelError } = await supabase.rpc(
          'cancel_vin_reservation',
          { p_vin: vin, p_user_id: userId }
        );
        
        if (cancelError) {
          logOperation('cancel_reservation_error', { requestId, error: cancelError.message }, 'error');
          return formatErrorResponse(`Failed to cancel reservation: ${cancelError.message}`, 400);
        }
        
        result = cancelResult;
        break;
      }
      
      case 'create':
      default: {
        const { data: createResult, error: createError } = await supabase.rpc(
          'create_vin_reservation',
          { 
            p_vin: vin, 
            p_user_id: userId,
            p_valuation_data: valuationData || null,
            p_duration_minutes: RESERVATION_DURATION_MINUTES
          }
        );
        
        if (createError) {
          logOperation('create_reservation_error', { requestId, error: createError.message }, 'error');
          return formatErrorResponse(`Failed to create reservation: ${createError.message}`, 400);
        }
        
        result = createResult;
        break;
      }
    }
    
    return formatSuccessResponse(result);
    
  } catch (err) {
    logOperation('reserve_vin_exception', { 
      requestId, 
      error: err.message,
      stack: err.stack
    }, 'error');
    
    return formatErrorResponse(`Error processing request: ${err.message}`, 500);
  }
});
