
/**
 * Request validation utilities for edge functions
 */
import { z } from "https://esm.sh/zod@3.22.2";
import { formatErrorResponse } from "./response-formatter.ts";

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
      throw new Error(`Validation error: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`, {
        cause: { code: 'VALIDATION_ERROR', details: error.errors }
      });
    }
    throw new Error('Failed to parse request body');
  }
}

/**
 * Handle request validation with standard error responses
 * @param request The request object
 * @param schema Zod schema to validate against
 * @returns [data, response] - data if valid, otherwise null with error response
 */
export async function handleRequestValidation<T>(
  request: Request, 
  schema: z.ZodSchema<T>
): Promise<[T | null, Response | null]> {
  try {
    const data = await validateRequest(request, schema);
    return [data, null];
  } catch (error) {
    const cause = error instanceof Error ? error.cause : undefined;
    const code = cause && typeof cause === 'object' && 'code' in cause ? String(cause.code) : undefined;
    const details = cause && typeof cause === 'object' && 'details' in cause ? cause.details : undefined;
    
    return [
      null, 
      formatErrorResponse(error as Error, 400, code, details)
    ];
  }
}

// Common schema definitions
export const VinSchema = z.string().length(17).regex(/^[A-HJ-NPR-Z0-9]{17}$/);
export const MileageSchema = z.number().positive().int().lt(1000000);
export const UserIdSchema = z.string().uuid();
export const GearboxSchema = z.string().refine(val => ['automatic', 'manual'].includes(val.toLowerCase()));
