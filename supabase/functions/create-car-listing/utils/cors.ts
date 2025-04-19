
/**
 * CORS utilities for create-car-listing
 * Created: 2025-04-19 - Extracted from inline implementation
 */

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400',
};

/**
 * Handle OPTIONS requests for CORS preflight
 * @returns Response with CORS headers
 */
export function handleCorsOptions(): Response {
  return new Response(null, {
    headers: corsHeaders
  });
}
