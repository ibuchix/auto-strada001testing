
/**
 * Utility functions for setup-profiles-rls edge function
 * Created: 2025-04-19
 */

// CORS headers for edge functions
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400',
};

export function formatResponse(data: any, status: number = 200): Response {
  return new Response(
    JSON.stringify(data),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status,
    }
  );
}

export function handleError(error: Error): Response {
  console.error('Error in setup-profiles-rls:', error);
  return formatResponse({
    success: false,
    error: error.message || 'Failed to set up profiles RLS policies'
  }, 500);
}

