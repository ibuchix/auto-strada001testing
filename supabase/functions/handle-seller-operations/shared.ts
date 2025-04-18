
/**
 * Shared utilities for handle-seller-operations edge function
 * Created: 2025-04-18
 * Purpose: Centralize common utility functions and constants
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

// CORS headers for cross-origin requests
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Max-Age": "86400",
};

// Log levels for structured logging
export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

/**
 * Structured logging function
 */
export function logOperation(
  operation: string, 
  details: Record<string, any>,
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
 * Create Supabase client with enhanced error handling
 */
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

/**
 * Format standardized API response
 */
export function formatResponse(
  data: any, 
  options: { 
    status?: number, 
    headers?: Record<string, string> 
  } = {}
): Response {
  const { 
    status = 200, 
    headers = corsHeaders 
  } = options;

  return new Response(
    JSON.stringify(data), 
    { 
      status, 
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    }
  );
}

// Common error handling class
export class ApiError extends Error {
  code: string;
  
  constructor(message: string, code: string = 'API_ERROR') {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

// Error codes for consistent error handling
export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
} as const;

