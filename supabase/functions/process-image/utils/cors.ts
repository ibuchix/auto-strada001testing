
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

export function handleCorsOptions(): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}
