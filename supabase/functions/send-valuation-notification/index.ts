/**
 * Edge function for manual valuation submissions
 * Updated: 2025-04-19 - Switched to local utils imports
 */

import { corsHeaders, formatSuccessResponse, formatErrorResponse } from './utils/index.ts';
import { NotificationService } from './services.ts';
import { ValuationRequest } from './types.ts';
import { validateRequest } from './validator.ts';
import { logOperation, logError } from './utils/index.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();
  logOperation('send_valuation_notification_start', { requestId });

  try {
    const data = await req.json();
    const validationResult = validateRequest(data);
    
    if (!validationResult.success) {
      throw new Error(validationResult.error);
    }

    const notificationService = new NotificationService();
    await notificationService.handleValuationRequest(data as ValuationRequest);

    logOperation('send_valuation_notification_complete', { requestId, success: true });
    return formatSuccessResponse({ success: true });
  } catch (error) {
    logError('send_valuation_notification', error, { requestId });
    return formatErrorResponse(error.message);
  }
});
