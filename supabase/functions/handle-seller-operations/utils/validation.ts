
/**
 * Request validation utilities
 * Updated: 2025-04-19 - Extracted from shared module
 */

import { formatErrorResponse } from './response.ts';
import { logOperation } from './logging.ts';

/**
 * Validates incoming request data
 */
export async function handleRequestValidation(
  req: Request,
  schema: any
): Promise<[any, Response | null]> {
  try {
    const body = await req.json();
    const validation = schema.safeParse(body);
    
    if (!validation.success) {
      const errors = validation.error.errors.map((e: any) => 
        `${e.path.join('.')}: ${e.message}`
      ).join(', ');
      
      logOperation('validation_error', {
        errors,
        body
      }, 'error');
      
      return [null, formatErrorResponse(
        `Invalid request data: ${errors}`,
        400,
        'VALIDATION_ERROR'
      )];
    }
    
    return [validation.data, null];
  } catch (error) {
    logOperation('request_parse_error', {
      error: error.message,
      stack: error.stack
    }, 'error');
    
    return [null, formatErrorResponse(
      'Failed to parse request body',
      400,
      'PARSE_ERROR'
    )];
  }
}
