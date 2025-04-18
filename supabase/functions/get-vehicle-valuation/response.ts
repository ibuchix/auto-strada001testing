
/**
 * Response formatting utilities
 */

import { corsHeaders } from "https://deno.land/x/cors@v1.2.2/mod.ts";

export const formatSuccessResponse = (data: any) => {
  return new Response(
    JSON.stringify({ success: true, data }),
    {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    }
  );
};

export const formatErrorResponse = (error: string, status = 400, code = 'ERROR') => {
  return new Response(
    JSON.stringify({ success: false, error, code }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    }
  );
};
