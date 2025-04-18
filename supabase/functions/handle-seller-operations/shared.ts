
/**
 * Inline shared utilities for handle-seller-operations
 * This file contains only the utilities needed by this function
 * to eliminate dependency on the _shared directory
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

// CORS headers for HTTP responses
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Max-Age": "86400",
};

// Log levels for structured logging
export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

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
  level: LogLevel = 'info'
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

// Create Supabase client with enhanced error handling
export function createSupabaseClient() {
  try {
    return createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );
  } catch (error) {
    logOperation('supabase_client_creation_failed', { 
      error: error.message 
    }, 'error');
    throw new Error('Failed to create Supabase client');
  }
}

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

// Error codes for consistent error handling
export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
} as const;

