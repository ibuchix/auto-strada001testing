
/**
 * Response formatting utilities
 */

import { corsHeaders } from './cors.ts';

export function formatResponse(
  body: Record<string, any>,
  options: { status?: number; headers?: Record<string, string> } = {}
): Response {
  const { status = 200, headers = {} } = options;
  
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
      ...headers,
    },
  });
}

export function formatErrorResponse(
  error: Error,
  status: number = 400,
  code?: string,
  details?: unknown
): Response {
  return formatResponse({
    success: false,
    error: error.message,
    code,
    details
  }, { status });
}

