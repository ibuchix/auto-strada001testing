
/**
 * Error handling for seller operations
 * Created: 2025-04-19
 */

import { corsHeaders } from './utils/cors.ts';
import { logOperation } from './utils/logging.ts';

export class OperationError extends Error {
  public code: string;
  public statusCode: number;
  
  constructor(message: string, code: string = 'OPERATION_ERROR', statusCode: number = 400) {
    super(message);
    this.name = 'OperationError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export function handleOperationError(error: unknown, requestId: string): Response {
  if (error instanceof OperationError) {
    logOperation('operation_error', {
      requestId,
      code: error.code,
      message: error.message,
      statusCode: error.statusCode
    }, 'error');
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        code: error.code
      }),
      {
        status: error.statusCode,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
  
  // Handle unknown errors
  const message = error instanceof Error ? error.message : 'An unknown error occurred';
  
  logOperation('unknown_error', {
    requestId,
    error: message,
    stack: error instanceof Error ? error.stack : undefined
  }, 'error');
  
  return new Response(
    JSON.stringify({
      success: false,
      error: message,
      code: 'INTERNAL_ERROR'
    }),
    {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    }
  );
}
