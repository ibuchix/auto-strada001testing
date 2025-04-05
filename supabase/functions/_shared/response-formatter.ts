
import { corsHeaders } from "./cors.ts";

/**
 * Format a successful response
 * @param data The data to include in the response
 * @returns Response object with the data
 */
export function formatSuccessResponse(data: any): Response {
  return new Response(
    JSON.stringify({
      success: true,
      data
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      },
      status: 200
    }
  );
}

/**
 * Format an error response
 * @param message The error message
 * @param status The HTTP status code
 * @param errorCode Optional error code for client handling
 * @returns Response object with the error
 */
export function formatErrorResponse(
  message: string,
  status: number = 400,
  errorCode: string = "GENERAL_ERROR"
): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: message,
      errorCode
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      },
      status
    }
  );
}
