
/**
 * Form Helper Utilities
 * Created: 2025-05-24
 * Updated: 2025-05-25 - Added watchField and getFieldValue functions
 * Updated: 2025-05-25 - Enhanced setFieldValue to include shouldValidate option
 * 
 * Contains utility functions for handling form data transformation
 * and database compatibility.
 */

import { UseFormReturn, Path, FieldPath } from "react-hook-form";

/**
 * Sets a form field value with type safety
 */
export const setFieldValue = <T extends Record<string, any>>(
  form: UseFormReturn<T>, 
  field: Path<T>, 
  value: any, 
  options: { shouldDirty?: boolean, shouldValidate?: boolean } = { shouldDirty: true }
) => {
  form.setValue(field, value, options);
};

/**
 * Type-safe wrapper around form.watch to get field values
 */
export const watchField = <V = any, T extends Record<string, any> = Record<string, any>>(
  form: UseFormReturn<T>,
  field: Path<T>
): V => {
  return form.watch(field) as V;
};

/**
 * Type-safe wrapper around form.getValues to get field values
 */
export const getFieldValue = <V = any, T extends Record<string, any> = Record<string, any>>(
  form: UseFormReturn<T>,
  field: Path<T>
): V => {
  return form.getValues(field) as V;
};

/**
 * Filters out frontend-only fields from form data before submission
 * to prevent database schema errors
 * 
 * @param formData The form data to filter
 * @param fieldsToFilter Array of field names to remove
 * @returns Filtered form data object
 */
export const filterFormFields = <T extends Record<string, any>>(
  formData: T,
  fieldsToFilter: string[]
): Partial<T> => {
  const filteredData = { ...formData };
  
  fieldsToFilter.forEach(field => {
    if (field in filteredData) {
      delete filteredData[field];
    }
  });
  
  return filteredData;
};

/**
 * Checks if a form field is a frontend-only field that shouldn't be sent to the database
 * 
 * @param fieldName The name of the field to check
 * @param frontendOnlyFields Array of frontend-only field names
 * @returns Boolean indicating if the field is frontend-only
 */
export const isFrontendOnlyField = (
  fieldName: string,
  frontendOnlyFields: string[]
): boolean => {
  return frontendOnlyFields.includes(fieldName);
};

/**
 * Helps with handling snake_case vs camelCase field name inconsistencies
 * by normalizing field names to the appropriate format
 * 
 * @param fieldName Field name to normalize
 * @param toSnakeCase Convert to snake_case if true, otherwise to camelCase
 * @returns Normalized field name
 */
export const normalizeFieldName = (
  fieldName: string,
  toSnakeCase: boolean = false
): string => {
  if (toSnakeCase) {
    // Convert camelCase to snake_case
    return fieldName.replace(/([A-Z])/g, '_$1').toLowerCase();
  } else {
    // Convert snake_case to camelCase
    return fieldName.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
  }
};

export default {
  setFieldValue,
  watchField,
  getFieldValue,
  filterFormFields,
  isFrontendOnlyField,
  normalizeFieldName
};
