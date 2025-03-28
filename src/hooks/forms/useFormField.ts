
/**
 * Changes made:
 * - Created custom hook for form field management
 * - Encapsulated field validation and state handling
 * - Added focus/blur event tracking
 * - Implemented consistent error handling
 * - 2025-11-05: Fixed TypeScript errors with field state typing
 */

import { useState, useCallback } from "react";
import { UseFormReturn, FieldValues, Path, ValidationRule } from "react-hook-form";

interface UseFormFieldProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  required?: boolean;
  validate?: (value: any) => true | string;
  maxLength?: ValidationRule<number>;
  minLength?: ValidationRule<number>;
  pattern?: ValidationRule<RegExp>;
}

export function useFormField<T extends FieldValues>({
  form,
  name,
  required = false,
  validate,
  maxLength,
  minLength,
  pattern
}: UseFormFieldProps<T>) {
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  
  // Get error from form state
  const error = form.formState.errors[name];
  
  // Handle field focus
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setIsTouched(true);
  }, []);
  
  // Handle field blur
  const handleBlur = useCallback(() => {
    setIsFocused(false);
    form.trigger(name);
  }, [form, name]);
  
  // Create field validation rules
  const rules = {
    ...(required && { required: `This field is required` }),
    ...(maxLength && { maxLength }),
    ...(minLength && { minLength }),
    ...(pattern && { pattern }),
    ...(validate && { validate })
  };
  
  // Handle mouse events
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);
  
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);
  
  // Safely access touchedFields and dirtyFields
  const isTouchedField = form.formState.touchedFields ? 
    (name in form.formState.touchedFields) : false;
  
  const isDirtyField = form.formState.dirtyFields ? 
    (name in form.formState.dirtyFields) : false;
  
  return {
    error,
    isFocused,
    isHovered,
    isTouched,
    rules,
    fieldState: {
      error,
      isTouched: isTouched || isTouchedField,
      isDirty: isDirtyField
    },
    eventHandlers: {
      onFocus: handleFocus,
      onBlur: handleBlur,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave
    }
  };
}
