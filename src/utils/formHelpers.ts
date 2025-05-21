
/**
 * Form Helper Utilities
 * Created: 2025-05-24
 * 
 * Contains utility functions for handling form data transformation
 * and database compatibility.
 */

import { UseFormReturn, Path } from "react-hook-form";

/**
 * Sets a form field value with type safety
 */
export const setFieldValue = <T extends Record<string, any>>(
  form: UseFormReturn<T>, 
  field: Path<T>, 
  value: any, 
  options: { shouldDirty?: boolean } = { shouldDirty: true }
) => {
  form.setValue(field, value, options);
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

export default {
  setFieldValue,
  filterFormFields,
  isFrontendOnlyField
};
