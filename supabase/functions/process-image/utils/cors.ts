
/**
 * CORS utilities for the process-image edge function
 */

// Define CORS headers
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// Handle CORS preflight requests
export function handleCorsOptions() {
  return new Response(null, {
    headers: corsHeaders,
    status: 204,
  });
}
