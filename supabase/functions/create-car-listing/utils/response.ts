
/**
 * Response utilities for create-car-listing
 * Created: 2025-05-06 - Moved from external dependency to local implementation
 */

import { corsHeaders } from "./cors.ts";

/**
 * Format success response with proper headers
 * @param data Response data
 * @param status HTTP status code
 * @returns Response object
 */
export function formatSuccessResponse(data: any, status = 200): Response {
  return new Response(
    JSON.stringify({
      success: true,
      data
    }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Format error response with proper headers
 * @param error Error object or message
 * @param status HTTP status code
 * @returns Response object
 */
export function formatErrorResponse(error: Error | string, status = 400): Response {
  const message = error instanceof Error ? error.message : error;
  
  return new Response(
    JSON.stringify({
      success: false,
      message
    }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}
