/**
 * Edge function for seller operations
 * Updated: 2025-04-19 - Updated to use local utilities
 */

import { corsHeaders, handleOptions } from "./utils/cors.ts";
import { logOperation } from "./utils/logging.ts";
import { formatResponse, formatErrorResponse } from "./utils/response.ts";
import { handleRequestValidation } from "./utils/validation.ts";
import { createSupabaseClient } from "./utils/supabase.ts";
import { handleGetValuation } from "./handlers/valuation-handler.ts";
import { handleCreateListingRequest } from "./handlers/listing-handler.ts";
import { handleProxyBidsRequest } from "./handlers/proxy-bids-handler.ts";
import { handleReserveVinRequest } from "./handlers/reservation-handler.ts";

// Request schema and validation
import { requestSchema } from "./schema-validation.ts";

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleOptions();
  }

  try {
    // Validate the request
    const [data, validationError] = await handleRequestValidation(req, requestSchema);
    if (validationError) return validationError;
    if (!data) throw new Error('Invalid request data');

    const supabase = createSupabaseClient();
    const requestId = crypto.randomUUID();

    // Log the incoming request
    logOperation('seller_operation_received', {
      requestId,
      operation: data.operation
    });

    // Process the operation
    switch (data.operation) {
      case 'get_valuation':
        return await handleGetValuation(supabase, data, requestId);
      case 'create_listing':
        return await handleCreateListingRequest(supabase, data, requestId);
      case 'process_proxy_bids':
        return await handleProxyBidsRequest(supabase, data, requestId);
      case 'reserve_vin':
        return await handleReserveVinRequest(supabase, data, requestId);
      default:
        return formatErrorResponse(
          new Error(`Unsupported operation: ${data.operation}`),
          400,
          'INVALID_OPERATION'
        );
    }
  } catch (error) {
    // Log and format any unhandled errors
    logOperation('unhandled_error', {
      error: error.message,
      stack: error.stack
    }, 'error');

    return formatErrorResponse(
      error,
      500,
      'INTERNAL_ERROR'
    );
  }
});
