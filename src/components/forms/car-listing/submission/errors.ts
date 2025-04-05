
/**
 * Changes made:
 * - 2024-06-07: Created initial error module for submission handling
 * - 2024-08-14: Updated to use standard application error architecture
 * - 2024-08-15: Fixed TypeScript errors with RecoveryType
 * - 2025-04-05: Fixed enum compatibility and type issues
 */

import { 
  ValidationError, 
  SubmissionError, 
  AppError
} from "@/errors/classes";
import { 
  RecoveryType, 
  ValidationErrorCode, 
  SubmissionErrorCode, 
  ErrorCode,
  RecoveryAction
} from "@/errors/types";

/**
 * Create a validation error for submission forms
 */
export function createValidationError(
  message: string, 
  description?: string,
  action?: { label: string; onClick: () => void }
) {
  return new ValidationError({
    message,
    code: ErrorCode.VALIDATION_ERROR,
    description,
    recovery: action ? {
      action: RecoveryAction.RETRY,
      label: action.label,
      handler: action.onClick,
      type: RecoveryType.FORM_RETRY
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
    message,
    code: ErrorCode.SUBMISSION_ERROR,
    description,
    retryable,
    recovery: action ? {
      action: RecoveryAction.RETRY,
      label: action.label,
      handler: action.onClick,
      type: RecoveryType.FORM_RETRY
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
 * Convert a generic error to a AppError
 * @deprecated Use error factory instead
 */
export function normalizeError(error: any): AppError {
  if (error instanceof AppError) {
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

// Export these types to fix imports in useFormSubmission
export { ValidationError, SubmissionError };

// Create type-safe aliases for backward compatibility
export type BaseApplicationError = AppError;
