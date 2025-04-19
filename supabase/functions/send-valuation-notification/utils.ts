
/**
 * Utility functions for send-valuation-notification edge function
 * Updated: 2025-04-19 - Enhanced with better error handling and response formatting
 */

// CORS headers for edge functions
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400',
};

// Type for log levels
export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

/**
 * Structured logging utility
 */
export function logOperation(
  operation: string, 
  details: Record<string, any> = {},
  level: LogLevel = 'info'
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    operation,
    level,
    ...details
  };
  
  switch (level) {
    case 'error':
      console.error(JSON.stringify(logEntry));
      break;
    case 'warn':
      console.warn(JSON.stringify(logEntry));
      break;
    case 'debug':
      console.debug(JSON.stringify(logEntry));
      break;
    default:
      console.log(JSON.stringify(logEntry));
  }
}

/**
 * Log an error with context information
 */
export function logError(
  context: string, 
  error: Error, 
  additionalDetails: Record<string, any> = {}
): void {
  logOperation(`${context}_error`, {
    errorMessage: error.message,
    errorName: error.name,
    errorStack: error.stack,
    ...additionalDetails
  }, 'error');
}

/**
 * Format a success response
 */
export function formatSuccessResponse(data: any): Response {
  return new Response(
    JSON.stringify(data),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  );
}

/**
 * Format an error response
 */
export function formatErrorResponse(message: string, status: number = 400): Response {
  return new Response(
    JSON.stringify({ error: message }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status,
    }
  );
}
