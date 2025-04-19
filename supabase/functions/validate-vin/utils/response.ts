
/**
 * Response formatting utilities for VIN validation
 * Updated: 2025-04-19 - Moved from standalone file to utils directory
 */

import { corsHeaders } from './cors';

export const formatSuccessResponse = (data: any) => {
  return new Response(
    JSON.stringify({
      success: true,
      data
    }),
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
    JSON.stringify({
      success: false,
      error,
      code
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    }
  );
};

export const formatServerErrorResponse = (error: any, status = 500, code = 'SERVER_ERROR') => {
  const message = error instanceof Error ? error.message : String(error);
  return new Response(
    JSON.stringify({
      success: false,
      error: `Server error: ${message}`,
      code
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    }
  );
};
