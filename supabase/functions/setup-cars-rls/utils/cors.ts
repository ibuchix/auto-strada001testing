
/**
 * CORS utilities for setup-cars-rls
 * Created: 2025-04-19
 */

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400',
};

export function handleCorsOptions(): Response {
  return new Response(null, {
    headers: corsHeaders
  });
}
