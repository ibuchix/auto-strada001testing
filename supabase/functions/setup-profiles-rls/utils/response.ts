
/**
 * Response formatting utilities for setup-profiles-rls
 * Created: 2025-04-19
 */

import { corsHeaders } from './cors';

/**
 * Format a successful response
 * @param data Response data
 * @param status HTTP status code
 * @returns Formatted Response object
 */
export function formatResponse(data: any, status: number = 200): Response {
  return new Response(
    JSON.stringify(data),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status,
    }
  );
}

/**
 * Format an error response
 * @param error Error object or message
 * @param status HTTP status code
 * @returns Formatted Response object
 */
export function formatErrorResponse(error: Error | string, status: number = 500): Response {
  const message = typeof error === 'string' ? error : error.message;
  
  return new Response(
    JSON.stringify({
      success: false,
      error: message || 'An unknown error occurred'
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status,
    }
  );
}

