
/**
 * Edge function for seller operations
 * Updated: 2025-04-19 - Switched to local utils imports
 */

import { corsHeaders, handleOptions } from "./utils/cors.ts";
import { logOperation } from "./utils/logging.ts";
import { handleRequestValidation } from "./utils/validation.ts";
import { createSupabaseClient } from "./utils/supabase.ts";
import { handleGetValuation } from "./handlers/valuation-handler.ts";
import { handleCreateListingRequest } from "./handlers/listing-handler.ts";
import { handleProxyBidsRequest } from "./handlers/proxy-bids-handler.ts";
import { handleReserveVinRequest } from "./handlers/reservation-handler.ts";
import { handleOperationError, OperationError } from "./error-handler.ts";
import { requestSchema } from "./schema-validation.ts";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleOptions();
  }

  const requestId = crypto.randomUUID();
  logOperation('seller_operation_received', { requestId });

  try {
    const [data, validationError] = await handleRequestValidation(req, requestSchema);
    if (validationError) return validationError;
    if (!data) throw new OperationError('Invalid request data', 'VALIDATION_ERROR');

    const supabase = createSupabaseClient();

    logOperation('processing_operation', {
      requestId,
      operation: data.operation
    });

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
        throw new OperationError(
          `Unsupported operation: ${data.operation}`,
          'INVALID_OPERATION'
        );
    }
  } catch (error) {
    return handleOperationError(error, requestId);
  }
});
