
/**
 * Utility functions for setup-cars-rls edge function
 * Created: 2025-04-18 - Made function self-contained by moving utilities here
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

