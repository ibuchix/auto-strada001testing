
/**
 * Standardized response formatting for edge functions
 */
import { corsHeaders } from "./cors.ts";

/**
 * Standard success response
 */
export function formatSuccessResponse(data: any, status: number = 200): Response {
  return new Response(
    JSON.stringify({
      success: true,
      data
    }),
    {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    }
  );
}

/**
 * Standard error response
 */
export function formatErrorResponse(
  error: string | Error,
  status: number = 400,
  code?: string,
  details?: any
): Response {
  const errorMessage = error instanceof Error ? error.message : error;
  const errorCode = code || (error instanceof Error && 'code' in error ? (error as any).code : undefined);
  
  return new Response(
    JSON.stringify({
      success: false,
      error: errorMessage,
      ...(errorCode && { code: errorCode }),
      ...(details && { details })
    }),
    {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    }
  );
}

/**
 * Format response for server errors
 */
export function formatServerErrorResponse(error: Error): Response {
  console.error('Internal server error:', error);
  
  return new Response(
    JSON.stringify({
      success: false,
      error: "Internal server error",
      details: error.message
    }),
    {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    }
  );
}
