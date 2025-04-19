/**
 * Edge function for sending valuation notifications
 * Updated: 2025-04-19 - Switched to use shared utilities from central repository
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { 
  corsHeaders,
  handleCorsOptions,
  logOperation,
  formatSuccessResponse,
  formatErrorResponse,
  validateRequest
} from "https://raw.githubusercontent.com/ibuchix/auto-strada001testing/main/supabase/shared-utils/mod.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsOptions();
  }

  const requestId = crypto.randomUUID();
  logOperation('send_valuation_notification_request', { requestId });

  try {
    // Parse and validate the request body
    const { userId, vin, valuation } = await req.json();

    if (!userId || !vin || !valuation) {
      logOperation('missing_parameters', { requestId, userId, vin, valuation }, 'warn');
      return formatErrorResponse('Missing required parameters', 400);
    }

    logOperation('processing_notification', { requestId, userId, vin });

    // Simulate sending a notification (replace with actual notification logic)
    const notificationResult = {
      success: true,
      message: `Notification sent to user ${userId} for VIN ${vin} with valuation ${valuation}`
    };

    logOperation('notification_sent', { requestId, userId, vin });
    return formatSuccessResponse(notificationResult);

  } catch (error) {
    logOperation('send_valuation_notification_error', { requestId, error: error.message }, 'error');
    return formatErrorResponse(`Error processing request: ${error.message}`, 500);
  }
});
