
/**
 * Error handling for handle-seller-operations
 * Created: 2025-06-01
 */

import { corsHeaders } from "https://raw.githubusercontent.com/ibuchix/auto-strada001testing/main/supabase/shared-utils/mod.ts";
import { logOperation } from "./utils/logging.ts";

/**
 * Custom error class with code for operation errors
 */
export class OperationError extends Error {
  code: string;

  constructor(message: string, code = 'OPERATION_ERROR') {
    super(message);
    this.name = 'OperationError';
    this.code = code;
  }
}

/**
 * Handle operation errors with proper formatting
 */
export function handleOperationError(error: any, requestId: string): Response {
  const isOperationError = error instanceof OperationError;
  const statusCode = isOperationError ? 400 : 500;
  const errorCode = isOperationError ? error.code : 'SERVER_ERROR';
  
  logOperation('operation_error', { 
    requestId,
    error: error.message,
    code: errorCode,
    stack: error.stack
  }, 'error');
  
  return new Response(
    JSON.stringify({
      success: false,
      error: error.message || 'Unknown error occurred',
      errorCode
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      },
      status: statusCode
    }
  );
}
