
/**
 * Response formatting utilities for create-car-listing
 * Created: 2025-04-19 - Extracted from inline implementation
 */

import { corsHeaders } from './cors.ts';

/**
 * Format a success response with proper headers
 * @param data Response data
 * @param status HTTP status code (default: 200)
 * @returns Formatted Response object
 */
export function formatSuccessResponse(data: any, status: number = 200): Response {
  return new Response(
    JSON.stringify({
      success: true,
      ...data
    }),
    { 
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status
    }
  );
}

/**
 * Format an error response with proper headers and status code
 * @param error Error message or object
 * @param status HTTP status code (default: 400)
 * @returns Formatted Response object
 */
export function formatErrorResponse(error: string | Error, status: number = 400): Response {
  const errorMessage = error instanceof Error ? error.message : error;
  
  return new Response(
    JSON.stringify({ 
      success: false,
      message: errorMessage,
      timestamp: new Date().toISOString()
    }),
    { 
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status
    }
  );
}
