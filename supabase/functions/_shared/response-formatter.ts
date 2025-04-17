
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

/**
 * Format server error response for unexpected errors
 * @param error The error object
 * @returns Formatted Response object
 */
export function formatServerErrorResponse(error: any): Response {
  console.error('Server error:', error);
  return formatErrorResponse(
    `Server error: ${error.message || 'Unknown error'}`,
    500,
    'INTERNAL_SERVER_ERROR'
  );
}

/**
 * Format a response with custom status
 * @param data The response data
 * @param success Whether the operation was successful
 * @param status HTTP status code
 * @returns Formatted Response object
 */
export function formatResponse(
  data: any,
  success = true,
  status = 200
): Response {
  return new Response(
    JSON.stringify({
      success,
      ...(success ? { data } : { error: data }),
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
