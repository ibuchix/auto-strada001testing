
/**
 * Response formatting utilities for handle-car-listing
 * Created: 2025-04-19 - Extracted from inline implementation
 */

import { corsHeaders } from './cors.ts';

/**
 * Format a success response with proper headers
 * @param data Response data
 * @returns Formatted Response object
 */
export function formatSuccessResponse(data: any): Response {
  return new Response(
    JSON.stringify(data),
    { 
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    }
  );
}

/**
 * Format an error response with proper headers and status code
 * @param error Error message or object
 * @param status HTTP status code
 * @returns Formatted Response object
 */
export function formatErrorResponse(error: string | Error, status: number = 400): Response {
  const errorMessage = error instanceof Error ? error.message : error;
  
  return new Response(
    JSON.stringify({ 
      error: 'Failed to process request',
      details: errorMessage,
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
