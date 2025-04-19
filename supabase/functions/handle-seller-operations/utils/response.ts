
/**
 * Response formatting utilities
 * Updated: 2025-04-19 - Extracted from shared module
 */

import { corsHeaders } from './cors.ts';

export interface ErrorResponse {
  success: boolean;
  error: string;
  details?: any;
  code?: string;
}

export interface SuccessResponse {
  success: boolean;
  data: any;
}

export type ApiResponse = ErrorResponse | SuccessResponse;

export function formatResponse(data: any): Response {
  return new Response(
    JSON.stringify({
      success: true,
      data
    }),
    {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    }
  );
}

export function formatErrorResponse(
  error: Error | string,
  status = 400,
  code?: string
): Response {
  const errorMessage = error instanceof Error ? error.message : error;
  
  return new Response(
    JSON.stringify({
      success: false,
      error: errorMessage,
      code
    }),
    {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    }
  );
}
