
/**
 * Shared request validation utility
 * Created: 2025-04-19
 */

import { z } from "https://esm.sh/zod@3.22.4";
import { formatErrorResponse } from './response.ts';

/**
 * Validate request body against a schema
 * @param request The request object
 * @param schema Zod schema to validate against
 * @returns Parsed data or throws an error
 */
export async function validateRequest<T>(
  request: Request, 
  schema: z.ZodSchema<T>
): Promise<T> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorDetails = error.errors.map(e => 
        `${e.path.join('.')}: ${e.message}`
      ).join(', ');
      
      throw new Error(`Validation error: ${errorDetails}`, {
        cause: { 
          code: 'VALIDATION_ERROR', 
          details: error.errors 
        }
      });
    }
    throw new Error('Failed to parse request body');
  }
}
