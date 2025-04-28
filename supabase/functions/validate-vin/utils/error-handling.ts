
/**
 * Error handling utilities for VIN validation
 * Created: 2025-04-28 - Added comprehensive error handling
 */

import { logOperation } from './logging.ts';

export interface ValidationErrorDetails {
  field: string;
  message: string;
  value?: any;
}

export class ValuationError extends Error {
  code: string;
  details?: ValidationErrorDetails[];
  
  constructor(message: string, code: string, details?: ValidationErrorDetails[]) {
    super(message);
    this.name = 'ValuationError';
    this.code = code;
    this.details = details;
  }
}

export function formatErrorResponse(error: Error | ValuationError | string, status = 400) {
  const errorMessage = error instanceof Error ? error.message : error;
  const errorDetails = error instanceof ValuationError ? error.details : undefined;
  const errorCode = error instanceof ValuationError ? error.code : 'UNKNOWN_ERROR';
  
  logOperation('error_response_formatted', {
    errorCode,
    errorMessage,
    hasDetails: !!errorDetails,
    status
  }, 'error');
  
  return new Response(
    JSON.stringify({
      success: false,
      error: errorMessage,
      code: errorCode,
      details: errorDetails
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
      }
    }
  );
}

export function handleApiError(error: unknown, requestId: string): Response {
  logOperation('api_error_handled', {
    requestId,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : String(error)
  }, 'error');
  
  if (error instanceof ValuationError) {
    return formatErrorResponse(error);
  }
  
  return formatErrorResponse('Internal server error', 500);
}
