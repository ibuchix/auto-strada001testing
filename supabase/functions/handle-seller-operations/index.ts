
/**
 * Edge function for seller operations
 * Updated: 2025-04-19 - Switched to use shared utilities from central repository
 * Updated: 2025-07-08 - Fixed modular imports from utils directory
 * Updated: 2025-05-30 - Fixed handleGetValuation import to resolve module error
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { 
  corsHeaders,
  handleCorsOptions,
  logOperation,
  formatSuccessResponse,
  formatErrorResponse,
  validateRequest,
  createRequestId
} from "https://raw.githubusercontent.com/ibuchix/auto-strada001testing/main/supabase/shared-utils/mod.ts";

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
    return handleCorsOptions();
  }

  const requestId = createRequestId();
  logOperation('seller_operation_received', { requestId });

  try {
    const [data, validationError] = await handleRequestValidation(req, requestSchema);
    if (validationError) return formatErrorResponse(validationError);
    if (!data) throw new OperationError('Invalid request data', 'VALIDATION_ERROR');

    const supabase = createSupabaseClient();

    logOperation('processing_operation', {
      requestId,
      operation: data.operation
    });

    switch (data.operation) {
      case 'get_valuation':
      case 'validate_vin':
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
