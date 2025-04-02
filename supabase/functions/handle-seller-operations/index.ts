
/**
 * Changes made:
 * - 2024-07-22: Refactored into smaller modules for better maintainability
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, logOperation } from "../_shared/index.ts";
import { validateRequest } from "./request-validator.ts";
import { handleValuationRequest } from "./handlers/valuation-handler.ts";
import { handleReserveVinRequest } from "./handlers/reservation-handler.ts";
import { handleCreateListingRequest } from "./handlers/listing-handler.ts";
import { handleProxyBidsRequest } from "./handlers/proxy-bids-handler.ts";
import { handleVinValidationRequest } from "./handlers/vin-validation-handler.ts";
import { getSupabaseClient } from "../_shared/client.ts";

// Main handler function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Generate a request ID for debugging/tracing
    const requestId = crypto.randomUUID();
    
    // Parse request body
    const requestData = await req.json();
    logOperation('request_received', { requestId, body: requestData });
    
    // Validate operation type
    const validationResult = validateRequest(requestData);
    
    if (!validationResult.success) {
      logOperation('validation_error', { 
        requestId, 
        error: validationResult.error 
      }, 'error');
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid request format",
          details: validationResult.details 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    const data = validationResult.data;
    
    // Initialize Supabase client
    const supabase = getSupabaseClient();
    
    // Route to appropriate handler based on operation type
    let result;
    
    switch (data.operation) {
      case "validate_vin":
        logOperation('validate_vin_start', { requestId, vin: data.vin });
        result = await handleVinValidationRequest(supabase, data, requestId);
        break;
        
      case "get_valuation":
        logOperation('get_valuation_start', { requestId, vin: data.vin });
        result = await handleValuationRequest(supabase, data, requestId);
        break;
        
      case "reserve_vin":
        logOperation('reserve_vin_start', { requestId, vin: data.vin, userId: data.userId });
        result = await handleReserveVinRequest(supabase, data, requestId);
        break;
        
      case "create_listing":
        logOperation('create_listing_start', { requestId, userId: data.userId, vin: data.vin });
        result = await handleCreateListingRequest(supabase, data, requestId);
        break;
      
      case "process_proxy_bids":
        logOperation('process_proxy_bids_start', { requestId, carId: data.carId });
        result = await handleProxyBidsRequest(supabase, data, requestId);
        break;
    }
    
    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
    
  } catch (error) {
    logOperation('unhandled_error', { 
      error: error.message,
      stack: error.stack
    }, 'error');
    
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error: " + error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
