
/**
 * Changes made:
 * - 2024-06-07: Created initial error module for submission handling
 * - 2025-12-01: Updated to use standard application error architecture
 */

import { 
  ValidationError, 
  SubmissionError, 
  BaseApplicationError 
} from "@/errors/classes";

/**
 * Create a validation error for submission forms
 */
export function createValidationError(
  message: string, 
  description?: string,
  action?: { label: string; onClick: () => void }
) {
  return new ValidationError({
    code: "VALIDATION_ERROR",
    message,
    description,
    recovery: action ? {
      type: 'form_retry',
      label: action.label,
      action: action.onClick
    } : undefined
  });
}

/**
 * Create a submission error for form submissions
 */
export function createSubmissionError(
  message: string, 
  description?: string,
  retryable: boolean = true,
  action?: { label: string; onClick: () => void }
) {
  return new SubmissionError({
    code: "SUBMISSION_ERROR",
    message,
    description,
    retryable,
    recovery: action ? {
      type: 'form_retry',
      label: action.label,
      action: action.onClick
    } : undefined
  });
}

/**
 * Type for submission-specific errors
 * @deprecated Use typed error classes instead
 */
export interface SubmissionErrorType {
  message: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Convert a generic error to a BaseApplicationError
 * @deprecated Use error factory instead
 */
export function normalizeError(error: any): BaseApplicationError {
  if (error instanceof BaseApplicationError) {
    return error;
  }

  // Handle submission error type
  if (error && typeof error === 'object' && 'message' in error) {
    return createSubmissionError(
      error.message,
      error.description,
      true,
      error.action
    );
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return createSubmissionError(error.message);
  }

  // Fallback
  return createSubmissionError(
    typeof error === 'string' ? error : 'An unknown error occurred'
  );
}
