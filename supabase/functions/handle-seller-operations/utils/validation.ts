
/**
 * Validation utilities for handle-seller-operations
 * Created: 2025-06-01
 */

import { logOperation } from "../utils/logging.ts";
import { formatErrorResponse } from "https://raw.githubusercontent.com/ibuchix/auto-strada001testing/main/supabase/shared-utils/mod.ts";
import { z } from "https://esm.sh/zod@3.22.2";

/**
 * Handle request validation with consistent error handling
 */
export async function handleRequestValidation<T>(
  req: Request, 
  schema: z.ZodSchema
): Promise<[T | null, Response | null]> {
  try {
    // Parse the JSON body
    const body = await req.json();
    
    logOperation('request_validation_start', { 
      operation: body?.operation,
      bodyFields: Object.keys(body || {}) 
    });
    
    // Parse with schema
    const parsedData = schema.parse(body);
    
    logOperation('request_validation_success', { 
      operation: parsedData.operation 
    });
    
    return [parsedData as T, null];
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map(e => 
        `${e.path.join('.')}: ${e.message}`
      ).join(', ');
      
      logOperation('request_validation_error', { 
        error: errorMessage,
        zodErrors: error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }))
      }, 'error');
      
      return [
        null, 
        formatErrorResponse({
          message: `Validation failed: ${errorMessage}`,
          name: 'ValidationError'
        }, 400, 'VALIDATION_ERROR')
      ];
    }
    
    // Handle other errors during validation
    logOperation('request_validation_exception', { 
      error: error.message || 'Unknown validation error',
      stack: error.stack
    }, 'error');
    
    return [
      null, 
      formatErrorResponse({
        message: `Request validation failed: ${error.message || 'Unknown error'}`,
        name: 'ValidationError'
      }, 400, 'VALIDATION_ERROR')
    ];
  }
}
