
/**
 * Response formatting utilities for process-proxy-bids
 * Created: 2025-04-19
 */

import { corsHeaders } from './cors.ts';

export function formatSuccessResponse(data: any): Response {
  return new Response(
    JSON.stringify({
      success: true,
      data
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    }
  );
}

export function formatErrorResponse(error: string, status = 400, code = 'ERROR'): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error,
      code
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    }
  );
}

export function formatServerErrorResponse(error: any, status = 500, code = 'SERVER_ERROR'): Response {
  const message = error instanceof Error ? error.message : String(error);
  return new Response(
    JSON.stringify({
      success: false,
      error: `Server error: ${message}`,
      code
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    }
  );
}
