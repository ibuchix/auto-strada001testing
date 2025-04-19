
/**
 * Response formatting utilities for setup-cars-rls
 * Created: 2025-04-19
 */

import { corsHeaders } from './cors.ts';

export function formatSuccessResponse(data: any, status: number = 200): Response {
  return new Response(
    JSON.stringify(data),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status,
    }
  );
}

export function formatErrorResponse(error: Error | string, status: number = 500): Response {
  const message = typeof error === 'string' ? error : error.message;
  
  return new Response(
    JSON.stringify({
      success: false,
      error: message
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status,
    }
  );
}

