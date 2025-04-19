
/**
 * Response utilities for reserve-vin
 * Created: 2025-04-19
 */

import { corsHeaders } from './cors.ts';

// Response formatters
export function formatSuccessResponse(data: any): Response {
  return new Response(
    JSON.stringify({ success: true, data }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  );
}

export function formatErrorResponse(message: string, status: number = 400): Response {
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
