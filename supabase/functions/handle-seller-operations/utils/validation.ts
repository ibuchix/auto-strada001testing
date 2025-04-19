
/**
 * Request validation utilities
 */

import { z } from "https://esm.sh/zod@3.22.2";
import { formatErrorResponse } from "./response.ts";

export class ValidationError extends Error {
  code: string;
  
  constructor(message: string, code: string = 'VALIDATION_ERROR') {
    super(message);
    this.name = 'ValidationError';
    this.code = code;
  }
}

export async function validateRequest<T>(
  request: Request, 
  schema: z.ZodSchema<T>
): Promise<T> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(
        `Validation error: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
        'VALIDATION_ERROR'
      );
    }
    throw new ValidationError('Failed to parse request body');
  }
}

export async function handleRequestValidation<T>(
  request: Request, 
  schema: z.ZodSchema<T>
): Promise<[T | null, Response | null]> {
  try {
    const data = await validateRequest(request, schema);
    return [data, null];
  } catch (error) {
    return [
      null, 
      formatErrorResponse(error as Error, 400, 'VALIDATION_ERROR')
    ];
  }
}

