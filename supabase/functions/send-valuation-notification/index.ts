
/**
 * Edge function for sending valuation notifications
 * Updated: 2025-04-29 - Removed external GitHub dependencies to avoid rate limits
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

// Handle CORS preflight requests
function handleCorsOptions() {
  return new Response(null, {
    headers: corsHeaders,
    status: 204,
  });
}

// Logging utility
function logOperation(operation: string, details: Record<string, any> = {}, level: 'info' | 'warn' | 'error' = 'info') {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    operation,
    level,
    ...details
  }));
}

// Response formatting utilities
function formatSuccessResponse(data: any) {
  return new Response(
    JSON.stringify({ success: true, data }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    }
  );
}

function formatErrorResponse(error: string, status = 400) {
  return new Response(
    JSON.stringify({ 
      success: false, 
      error,
      code: 'ERROR'
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status
    }
  );
}

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
