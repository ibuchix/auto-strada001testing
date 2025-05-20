
/**
 * Form Helper Utilities
 * Created: 2025-05-22 - Added type-safe form field access utilities
 */

import { Path, UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";

/**
 * Type-safe function to watch a field in a form 
 * when the field name might be dynamic
 */
export function watchField<T = any>(
  form: UseFormReturn<CarListingFormData>, 
  fieldName: string
): T {
  return form.watch(fieldName as Path<CarListingFormData>) as T;
}

/**
 * Type-safe function to set a field value in a form
 * when the field name might be dynamic
 */
export function setFieldValue<T = any>(
  form: UseFormReturn<CarListingFormData>,
  fieldName: string,
  value: T,
  options?: { shouldDirty?: boolean; shouldTouch?: boolean }
): void {
  form.setValue(fieldName as Path<CarListingFormData>, value as any, options);
}

/**
 * Type-safe function to register a field in a form
 * when the field name might be dynamic
 */
export function registerField(
  form: UseFormReturn<CarListingFormData>,
  fieldName: string
) {
  return form.register(fieldName as Path<CarListingFormData>);
}

/**
 * Convert camelCase field names to snake_case
 * to match database schema
 */
export function toSnakeCase(fieldName: string): string {
  return fieldName.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Convert snake_case field names to camelCase
 * for legacy compatibility
 */
export function toCamelCase(fieldName: string): string {
  return fieldName.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}
