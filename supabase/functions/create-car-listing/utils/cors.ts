
/**
 * CORS utilities for create-car-listing edge function
 * Created: 2025-04-22 - Added to resolve import error in edge function
 */

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400',
};

/**
 * Handle CORS preflight requests
 * @returns Response with CORS headers
 */
export function handleCorsOptions(): Response {
  return new Response(null, {
    headers: corsHeaders,
    status: 204
  });
}
