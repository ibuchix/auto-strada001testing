
/**
 * Response utilities for handle-seller-operations
 * Created: 2025-04-19 - Extracted from utils.ts
 */

import { corsHeaders } from './cors.ts';

export function formatSuccessResponse(data: any): Response {
  return new Response(
    JSON.stringify({ success: true, data }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  );
}

export function formatErrorResponse(message: string, code: string = 'ERROR', status: number = 400): Response {
  return new Response(
    JSON.stringify({ 
      success: false, 
      error: message,
      code
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status,
    }
  );
}

export function formatServerErrorResponse(error: Error | string, status: number = 500, code: string = 'SERVER_ERROR'): Response {
  const message = error instanceof Error ? error.message : error;
  
  return new Response(
    JSON.stringify({ 
      success: false, 
      error: message,
      code
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status,
    }
  );
}
