
/**
 * Shared utilities for handle-seller-operations
 * Created: 2025-06-01
 */

import { corsHeaders } from "https://raw.githubusercontent.com/ibuchix/auto-strada001testing/main/supabase/shared-utils/mod.ts";

// Format response with proper CORS headers
export const formatResponse = {
  success: (data: any) => {
    return new Response(
      JSON.stringify({
        success: true,
        data
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        },
        status: 200
      }
    );
  },
  error: (message: string, status = 400, code = 'ERROR') => {
    return new Response(
      JSON.stringify({
        success: false,
        error: message,
        errorCode: code
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        },
        status
      }
    );
  }
};
