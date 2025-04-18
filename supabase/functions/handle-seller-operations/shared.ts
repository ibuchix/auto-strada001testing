
/**
 * Inline shared utilities for handle-seller-operations
 * This file contains only the utilities needed by this function
 * to eliminate dependency on the _shared directory
 */

// CORS headers for HTTP responses
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

// Custom validation error class
export class ValidationError extends Error {
  code: string;
  status: number;
  
  constructor(message: string, code = "VALIDATION_ERROR", status = 400) {
    super(message);
    this.name = "ValidationError";
    this.code = code;
    this.status = status;
  }
}

// Structured logging utility
export const logOperation = (
  operation: string, 
  details: Record<string, any> = {},
  level: 'info' | 'warn' | 'error' | 'debug' = 'info'
): void => {
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
};

// Response formatting utility
export const formatResponse = {
  success: (data: any, status = 200) => {
    return new Response(
      JSON.stringify({
        success: true,
        data
      }),
      {
        status,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  },
  
  error: (error: string | Error, status = 400, code = 'ERROR') => {
    const message = error instanceof Error ? error.message : error;
    const errorCode = error instanceof ValidationError ? error.code : code;
    const statusCode = error instanceof ValidationError ? error.status : status;
    
    return new Response(
      JSON.stringify({
        success: false,
        error: message,
        code: errorCode
      }),
      {
        status: statusCode,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
};

