
/**
 * Edge function for VIN reservation
 * Updated: 2025-05-06 - Fixed authentication issues and permissions
 * Updated: 2025-05-06 - Fixed import path for shared client
 * Updated: 2025-05-07 - Fixed parameter order for database function
 * Updated: 2025-05-08 - Improved error handling and response formatting
 * Updated: 2025-05-10 - Enhanced CORS handling for Lovable environments
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { 
  corsHeaders, 
  handleCorsOptions, 
  logOperation, 
  formatSuccessResponse, 
  formatErrorResponse,
  createRequestId
} from "https://raw.githubusercontent.com/ibuchix/auto-strada001testing/main/supabase/shared-utils/mod.ts";

// Enhanced CORS headers to support Lovable domains
const enhancedCorsHeaders = {
  ...corsHeaders,
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, origin',
  'Access-Control-Max-Age': '86400',
};

// Duration that a VIN reservation is valid for
const RESERVATION_DURATION_MINUTES = 30;

/**
 * Enhanced CORS preflight handler
 */
function handleEnhancedCorsOptions(): Response {
  return new Response(null, {
    headers: enhancedCorsHeaders,
    status: 204,
  });
}

/**
 * Create a Supabase client with admin privileges
 */
function getSupabaseClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL") || "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
    {
      auth: {
        persistSession: false,
      },
    }
  );
}

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
  // Handle CORS preflight requests with enhanced headers
  if (req.method === "OPTIONS") {
    return handleEnhancedCorsOptions();
  }

  const requestId = crypto.randomUUID();
  logOperation('reserve_vin_request', { requestId, method: req.method });

  try {
    // Use the local getSupabaseClient function
    const supabase = getSupabaseClient();
    
    // Clean up any expired reservations
    try {
      await supabase.rpc('cleanup_expired_vin_reservations');
    } catch (cleanupError) {
      console.warn('Failed to clean up expired reservations:', cleanupError);
      // Continue anyway, this is just a maintenance operation
    }
    
    // Parse the request
    let data: ReserveVinRequest;
    try {
      data = await req.json();
    } catch (parseError) {
      logOperation('request_parse_error', { 
        requestId, 
        error: parseError.message 
      }, 'error');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid JSON in request body'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...enhancedCorsHeaders
          }
        }
      );
    }
    
    // Log request body for debugging
    logOperation('request_body', {
      requestId,
      vin: data.vin,
      userId: data.userId,
      action: data.action || 'create',
      hasValuationData: !!data.valuationData
    }, 'debug');
    
    // Validate request
    const validation = validateRequest(data);
    if (!validation.valid) {
      logOperation('validation_error', {
        requestId,
        error: validation.error
      }, 'error');
      return new Response(
        JSON.stringify({
          success: false,
          error: validation.error || "Invalid request"
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...enhancedCorsHeaders
          }
        }
      );
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
        logOperation('create_reservation_start', { requestId, vin, userId }, 'info');
        
        // Function signature: create_vin_reservation(p_vin, p_user_id, p_valuation_data, p_duration_minutes)
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
          // Handle duplicate key error as a special case
          if (createError.message.includes('duplicate key value')) {
            logOperation('duplicate_vin_reservation', { 
              requestId, 
              vin,
              userId,
              error: createError.message
            }, 'warn');
            
            // This is a duplicate key error - provide detailed response
            return new Response(
              JSON.stringify({
                success: true, // We mark as success to let the client know this is expected
                data: {
                  error: createError.message,
                  success: false,
                  message: "This VIN is already reserved"
                }
              }),
              {
                headers: {
                  'Content-Type': 'application/json',
                  ...enhancedCorsHeaders
                },
                status: 200 // Use 200 since this is an expected condition
              }
            );
          }
          
          logOperation('create_reservation_error', { 
            requestId, 
            error: createError.message,
            errorCode: createError.code,
            details: createError.details,
            hint: createError.hint
          }, 'error');
          
          return new Response(
            JSON.stringify({
              success: false,
              error: `Failed to create reservation: ${createError.message}`
            }),
            {
              headers: {
                'Content-Type': 'application/json',
                ...enhancedCorsHeaders
              },
              status: 400
            }
          );
        }
        
        // Log detailed response for debugging
        logOperation('create_reservation_success', {
          requestId,
          resultType: typeof createResult,
          resultKeys: createResult ? Object.keys(createResult) : [],
          success: createResult?.success,
          reservationId: createResult?.reservationId
        }, 'info');
        
        result = createResult;
        break;
      }
    }
    
    // Ensure result is not undefined or null
    if (result === undefined || result === null) {
      logOperation('empty_result', { requestId, action }, 'error');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Operation returned no result'
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            ...enhancedCorsHeaders
          },
          status: 500
        }
      );
    }
    
    // Log successful response
    logOperation('operation_success', {
      requestId,
      action,
      resultType: typeof result,
      hasSuccess: 'success' in result,
      hasError: 'error' in result,
      hasReservationId: 'reservationId' in result
    }, 'info');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: result 
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...enhancedCorsHeaders
        },
        status: 200
      }
    );
    
  } catch (err) {
    logOperation('reserve_vin_exception', { 
      requestId, 
      error: err.message,
      stack: err.stack
    }, 'error');
    
    return new Response(
      JSON.stringify({
        success: false,
        error: `Error processing request: ${err.message}`
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...enhancedCorsHeaders
        },
        status: 500
      }
    );
  }
});
