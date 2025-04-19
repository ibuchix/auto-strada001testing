
/**
 * Utility functions for setup-cars-rls edge function
 * Updated: 2025-04-19 - Made function fully self-contained with all required utilities
 */

// CORS headers for edge functions
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400',
};

// Handle CORS preflight requests
export function handleCorsOptions(): Response {
  return new Response(null, {
    headers: corsHeaders
  });
}

/**
 * Format a success response
 * @param data The data to include in the response
 * @param status HTTP status code (default: 200)
 */
export function formatSuccessResponse(data: any, status: number = 200): Response {
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
 * @param error The error object or message
 * @param status HTTP status code (default: 500)
 */
export function formatErrorResponse(error: Error | string, status: number = 500): Response {
  const message = typeof error === 'string' ? error : error.message;
  
  return new Response(
    JSON.stringify({
      success: false,
      error: message
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status,
    }
  );
}

/**
 * Log an operation with details
 * @param operation Name of the operation
 * @param details Additional details to log
 */
export function logOperation(operation: string, details: Record<string, any> = {}): void {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    operation,
    ...details
  }));
}

/**
 * Log an error with context
 * @param context The context where the error occurred
 * @param error The error object
 * @param additionalDetails Additional details to include
 */
export function logError(context: string, error: Error, additionalDetails: Record<string, any> = {}): void {
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    context,
    error: {
      message: error.message,
      name: error.name,
      stack: error.stack
    },
    ...additionalDetails
  }));
}
