
/**
 * Shared response formatting utilities
 * Created: 2025-04-19
 * Updated: 2025-05-08 - Enhanced error handling and response consistency
 */

import { corsHeaders } from './cors.ts';

/**
 * Format a successful response
 * @param data Response payload
 * @param status HTTP status code
 * @returns Formatted Response
 */
export function formatSuccessResponse(
  data: any, 
  status: number = 200
): Response {
  // Ensure data is never undefined/null
  const safeData = data === undefined || data === null ? {} : data;
  
  // Always wrap response in a standardized format
  const responseBody = {
    success: true,
    data: safeData
  };
  
  return new Response(
    JSON.stringify(responseBody),
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
 * Format an error response
 * @param error Error message or Error object
 * @param status HTTP status code
 * @param code Optional error code
 * @returns Formatted Response
 */
export function formatErrorResponse(
  error: string | Error, 
  status: number = 400,
  code?: string
): Response {
  const message = error instanceof Error ? error.message : error;
  
  return new Response(
    JSON.stringify({ 
      success: false, 
      error: message || 'Unknown error',
      code: code || 'ERROR'
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
