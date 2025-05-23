
/**
 * Database transformers for handling the conversion between frontend (camelCase)
 * and database (snake_case) formats
 * 
 * Created: 2025-05-24
 * Updated: 2025-05-30 - Fixed TypeScript errors with direction type
 * Updated: 2025-05-31 - Added proper type handling for transform functions
 * Updated: 2025-06-01 - Fixed TransformDirection type issues
 * Updated: 2025-06-07 - Fixed type safety for transformers with unknown intermediate
 */

import { CarListingFormData } from "@/types/forms";
import { transformObjectToCamelCase, transformObjectToSnakeCase } from "./dataTransformers";

/**
 * Direction type for database transformation
 */
export type TransformDirection = 'toDatabase' | 'toFrontend';

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
  direction: TransformDirection
): (data: T) => R {
  return (data: T): R => {
    if (direction === 'toDatabase') {
      // Use unknown as intermediate type for safe type conversion
      return transformObjectToSnakeCase(data) as unknown as R;
    } else {
      // Use unknown as intermediate type for safe type conversion
      return transformObjectToCamelCase(data) as unknown as R;
    }
  };
}

/**
 * Helper function to create a Supabase query boundary
 * that automatically handles transformations
 */
export function withDbTransformation<T, R>(
  operation: (data: R) => Promise<T>,
  direction: TransformDirection = 'toDatabase'
) {
  const transform = createDatabaseBoundary<T, R>(direction);
  
  return async (data: T): Promise<T> => {
    // Safe type conversion with unknown as intermediate
    const transformedData = transform(data) as R;
    const result = await operation(transformedData);
    return direction === 'toDatabase' 
      ? result 
      : (transform(result as unknown as T) as unknown as T);
  };
}
