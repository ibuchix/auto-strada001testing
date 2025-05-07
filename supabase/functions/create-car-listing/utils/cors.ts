
/**
 * CORS utilities for create-car-listing
 * Created: 2025-05-08 - Added to support better cross-origin requests
 */

/**
 * CORS headers for edge function responses
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};
