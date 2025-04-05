
import { corsHeaders } from "./cors.ts";

/**
 * Format a successful response
 * @param data Any data to return in the response
 * @param status HTTP status code (default 200)
 * @returns Formatted Response object
 */
export function formatSuccessResponse(data: any, status = 200): Response {
  return new Response(
    JSON.stringify({
      success: true,
      data,
      timestamp: new Date().toISOString()
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
 * Format an error response
 * @param message Error message
 * @param status HTTP status code (default 400)
 * @param errorCode Optional error code identifier
 * @returns Formatted Response object
 */
export function formatErrorResponse(
  message: string, 
  status = 400, 
  errorCode = "GENERAL_ERROR"
): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: message,
      errorCode,
      timestamp: new Date().toISOString()
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
