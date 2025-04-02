
/**
 * Shared utilities for edge functions
 */

// CORS headers for all edge functions
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Log severity types
type LogSeverity = 'info' | 'warn' | 'error';

/**
 * Standardized operation logging with timestamp and optional severity
 */
export function logOperation(
  operation: string, 
  details: Record<string, any>,
  severity: LogSeverity = 'info'
): void {
  const timestamp = new Date().toISOString();
  const detailsWithTimestamp = { timestamp, ...details };
  
  switch (severity) {
    case 'warn':
      console.warn(`[${timestamp}] [${operation}]`, detailsWithTimestamp);
      break;
    case 'error':
      console.error(`[${timestamp}] [${operation}]`, detailsWithTimestamp);
      break;
    default:
      console.log(`[${timestamp}] [${operation}]`, detailsWithTimestamp);
  }
}

/**
 * Custom error for validation failures
 */
export class ValidationError extends Error {
  code: string;
  
  constructor(message: string, code: string = 'VALIDATION_ERROR') {
    super(message);
    this.name = 'ValidationError';
    this.code = code;
  }
}

/**
 * Format a successful response
 */
export function formatSuccessResponse(data: any): Response {
  return new Response(
    JSON.stringify({
      success: true,
      ...data
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Format an error response
 */
export function formatErrorResponse(
  message: string, 
  status: number = 400,
  code: string = 'ERROR'
): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: message,
      code
    }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Format a server error response
 */
export function formatServerErrorResponse(error: Error): Response {
  return formatErrorResponse(
    `Server error: ${error.message}`,
    500,
    'SERVER_ERROR'
  );
}

/**
 * Check if a string is a valid VIN
 */
export function isValidVin(vin: string): boolean {
  // Basic VIN validation: 11-17 alphanumeric characters
  // Excludes I, O, Q as per standard
  const vinRegex = /^[A-HJ-NPR-Z0-9]{11,17}$/;
  return vinRegex.test(vin);
}

/**
 * Check if a number is a valid mileage
 */
export function isValidMileage(mileage: number): boolean {
  return !isNaN(mileage) && mileage >= 0 && mileage <= 1000000;
}
