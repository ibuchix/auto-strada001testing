
/**
 * Form Helper Utilities
 * Created: 2025-05-22 - Added type-safe form field access utilities
 * Updated: 2025-05-23 - Added dynamic field path handling and additional utility functions
 * Updated: 2025-05-24 - Added support for camelCase field names with snake_case database fields
 * Updated: 2025-05-28 - Enhanced field access helpers with dynamic paths for better TypeScript support
 */

import { Path, UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { toCamelCase, toSnakeCase } from "./dataTransformers";
import { getFrontendFieldName } from "./formFieldMapping";

/**
 * Type-safe function to watch a field in a form 
 * when the field name might be dynamic
 */
export function watchField<T = any>(
  form: UseFormReturn<CarListingFormData>, 
  fieldName: string
): T {
  // Convert any snake_case field names to camelCase for frontend
  const formattedFieldName = getFrontendFieldName(fieldName);
  return form.watch(formattedFieldName as Path<CarListingFormData>) as T;
}

/**
 * Type-safe function to set a field value in a form
 * when the field name might be dynamic
 */
export function setFieldValue<T = any>(
  form: UseFormReturn<CarListingFormData>,
  fieldName: string | keyof CarListingFormData,
  value: T,
  options?: { shouldDirty?: boolean; shouldTouch?: boolean; shouldValidate?: boolean }
): void {
  // Convert any snake_case field names to camelCase for frontend
  const formattedFieldName = typeof fieldName === 'string' ? 
    getFrontendFieldName(fieldName) : 
    fieldName;
  form.setValue(formattedFieldName as Path<CarListingFormData>, value as any, options);
}

/**
 * Type-safe function to register a field in a form
 * when the field name might be dynamic
 */
export function registerField(
  form: UseFormReturn<CarListingFormData>,
  fieldName: string
) {
  // Convert any snake_case field names to camelCase for frontend
  const formattedFieldName = getFrontendFieldName(fieldName);
  return form.register(formattedFieldName as Path<CarListingFormData>);
}

/**
 * Type-safe function to get values from a form
 * for a specific field or all fields
 */
export function getFieldValue<T = any>(
  form: UseFormReturn<CarListingFormData>,
  fieldName?: string | keyof CarListingFormData
): T {
  if (fieldName) {
    // Convert any snake_case field names to camelCase for frontend
    const formattedFieldName = typeof fieldName === 'string' ? 
      getFrontendFieldName(fieldName) : 
      fieldName;
    return form.getValues(formattedFieldName as Path<CarListingFormData>) as T;
  }
  return form.getValues() as T;
}

/**
 * Convert form data to database format (camelCase to snake_case)
 */
export function prepareFormDataForDatabase(data: Partial<CarListingFormData>): Record<string, any> {
  const result: Record<string, any> = {};
  
  Object.entries(data).forEach(([key, value]) => {
    const snakeKey = toSnakeCase(key);
    result[snakeKey] = value;
  });
  
  return result;
}

/**
 * Convert database data to form format (snake_case to camelCase)
 */
export function prepareDatabaseDataForForm(data: Record<string, any>): Partial<CarListingFormData> {
  const result: Record<string, any> = {};
  
  Object.entries(data).forEach(([key, value]) => {
    const camelKey = toCamelCase(key);
    result[camelKey] = value;
  });
  
  return result as Partial<CarListingFormData>;
}
