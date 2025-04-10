
/**
 * CORS headers for cross-origin requests
 * Updated to match shared implementation for consistency
 */
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Max-Age": "86400",
};

/**
 * Helper to handle OPTIONS requests for CORS preflight
 * @returns Response with CORS headers
 */
export function handleCorsOptions(): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}
