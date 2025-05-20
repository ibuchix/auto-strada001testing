
/**
 * Database transformers for handling the conversion between frontend (camelCase)
 * and database (snake_case) formats
 * 
 * Created: 2025-05-24
 */

import { CarListingFormData } from "@/types/forms";
import { transformObjectToCamelCase, transformObjectToSnakeCase } from "./dataTransformers";

/**
 * Transforms form data (camelCase) to database format (snake_case)
 * for insertion or update operations
 */
export function transformFormToDb(formData: Partial<CarListingFormData>): Record<string, any> {
  // First, convert all camelCase keys to snake_case
  return transformObjectToSnakeCase(formData);
}

/**
 * Transforms database data (snake_case) to frontend format (camelCase)
 * for use in the application components
 */
export function transformDbToForm<T = Partial<CarListingFormData>>(dbData: Record<string, any>): T {
  // First, convert all snake_case keys to camelCase
  return transformObjectToCamelCase(dbData) as T;
}

/**
 * Creates a boundary function that handles the transformation
 * between frontend and database formats for any data
 */
export function createDatabaseBoundary<T, R = Record<string, any>>(
  direction: 'toDatabase' | 'toFrontend'
) {
  return (data: direction extends 'toDatabase' ? T : R): direction extends 'toDatabase' ? R : T => {
    if (direction === 'toDatabase') {
      return transformObjectToSnakeCase(data) as any;
    } else {
      return transformObjectToCamelCase(data) as any;
    }
  };
}

/**
 * Helper function to create a Supabase query boundary
 * that automatically handles transformations
 */
export function withDbTransformation<T, R>(
  operation: (data: R) => Promise<T>,
  direction: 'toDatabase' | 'toFrontend' = 'toDatabase'
) {
  const transform = createDatabaseBoundary<T, R>(direction);
  
  return async (data: direction extends 'toDatabase' ? T : R): Promise<direction extends 'toDatabase' ? R : T> => {
    const transformedData = transform(data as any);
    const result = await operation(transformedData as R);
    return direction === 'toDatabase' ? result as any : transform(result as any);
  };
}
