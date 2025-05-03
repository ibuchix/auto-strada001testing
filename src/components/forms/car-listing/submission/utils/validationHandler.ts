
/**
 * Form validation handler utilities
 * Updated: 2025-07-03 - Fixed error codes and format
 */

import { UseFormReturn } from 'react-hook-form';
import { AppError } from '@/errors/classes';
import { ErrorCode, ErrorSeverity, ErrorCategory } from '@/errors/types';
import { CarListingFormData } from '@/types/forms';

export const handleFormValidationError = (
  form: UseFormReturn<CarListingFormData>, 
  error: unknown
): AppError => {
  // If it's already an AppError, just return it
  if (error instanceof AppError) {
    return error;
  }
  
  // Generic validation error
  const validationError = new AppError({
    message: 'Validation error',
    code: ErrorCode.VALIDATION_ERROR,
    category: ErrorCategory.VALIDATION, 
    severity: ErrorSeverity.WARNING,
    metadata: {}
  });
  
  // Extract field errors from form state if available
  const fieldErrors = Object.entries(form.formState.errors).map(([field, error]) => {
    return {
      field,
      message: error.message || 'Invalid value'
    };
  });
  
  if (fieldErrors.length > 0) {
    validationError.metadata = { fieldErrors };
    validationError.message = `Found ${fieldErrors.length} form validation errors`;
  }
  
  // If we have a Javascript error, include its info
  if (error instanceof Error) {
    validationError.message = error.message || validationError.message;
    validationError.stack = error.stack;
  }
  
  // Set focus on first error field
  if (fieldErrors.length > 0) {
    try {
      form.setFocus(fieldErrors[0].field as any);
    } catch (focusError) {
      console.error('Failed to set focus:', focusError);
    }
  }
  
  return validationError;
};

export const handleFieldValidationError = (
  form: UseFormReturn<CarListingFormData>,
  field: string,
  message: string
): void => {
  form.setError(field as any, {
    type: 'manual',
    message
  });
};

export const handleImageValidationErrors = (
  form: UseFormReturn<CarListingFormData>,
  errors: Array<{field: string, message: string}>
): AppError => {
  const validationError = new AppError({
    message: 'Image validation errors',
    code: ErrorCode.VALIDATION_ERROR,
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.WARNING,
    metadata: { fieldErrors: errors }
  });
  
  // Set each error on the form
  errors.forEach(({field, message}) => {
    form.setError(field as any, {
      type: 'manual',
      message
    });
  });
  
  return validationError;
};
