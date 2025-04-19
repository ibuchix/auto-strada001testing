
/**
 * Schema validation functionality
 * Created: 2025-04-19 - Split from schemaValidation.ts
 */

import { validateFormAgainstSchema } from "./validator";
import { resetSchemaValidationCache } from "./cache";
import { getSchemaValidationDiagnostics, isDevelopment } from "./diagnostics";

export const validateFormSchema = async (
  formData: Record<string, any>,
  tableName: string
): Promise<string[]> => {
  if (process.env.NODE_ENV === 'production') {
    return [];
  }
  
  try {
    return await validateFormAgainstSchema(formData, tableName, {
      throwOnError: false,
      showWarnings: false
    });
  } catch (error) {
    console.warn('Schema validation error:', error);
    return [];
  }
};

export {
  resetSchemaValidationCache,
  getSchemaValidationDiagnostics,
  isDevelopment,
  validateFormAgainstSchema
};

export type { ValidationError } from "./validator";
