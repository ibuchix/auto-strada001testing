
/**
 * Error factory for creating standardized error objects
 * Created: 2025-12-01
 * Updated: 2028-05-15: Enhanced with new error types
 * Updated: 2028-05-18: Fixed RecoveryAction property names
 */

import {
  ErrorCategory,
  RecoveryType,
  ValidationErrorCode,
  SubmissionErrorCode,
  AuthErrorCode,
  NetworkErrorCode
} from './types';
import {
  BaseApplicationError,
  ValidationError,
  FieldValidationError,
  FormValidationError,
  SubmissionError,
  NetworkError,
  TimeoutError,
  AuthenticationError
} from './classes';

/**
 * Creates a field validation error
 */
export function createFieldError(field: string, message: string, options: {
  code?: ValidationErrorCode;
  description?: string;
  focus?: boolean;
} = {}) {
  const focusAction = options.focus !== false ? () => {
    const element = document.getElementById(field);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => element.focus(), 100);
    }
  } : () => {};

  return new FieldValidationError({
    field,
    message,
    code: options.code || ValidationErrorCode.INVALID_FORMAT,
    description: options.description,
    recovery: {
      type: RecoveryType.FIELD_CORRECTION,
      label: 'Fix Field',
      fieldId: field,  // Changed from 'field' to 'fieldId'
      action: focusAction
    }
  });
}

/**
 * Creates a form validation error
 */
export function createFormError(message: string, options: {
  code?: ValidationErrorCode;
  description?: string;
  fields?: string[];
} = {}) {
  return new FormValidationError({
    message,
    code: options.code || ValidationErrorCode.INCOMPLETE_FORM,
    description: options.description,
    fields: options.fields,
    recovery: {
      type: RecoveryType.FORM_RETRY,
      label: 'Review Form',
      action: () => window.scrollTo(0, 0)
    }
  });
}

/**
 * Creates a network error
 */
export function createNetworkError(message: string, options: {
  description?: string;
  retryAction?: () => void;
} = {}) {
  return new NetworkError({
    message,
    description: options.description,
    recovery: {
      type: RecoveryType.REFRESH,
      label: 'Try Again',
      action: options.retryAction || (() => window.location.reload())
    }
  });
}

/**
 * Creates a timeout error
 */
export function createTimeoutError(message: string, options: {
  description?: string;
  timeout?: number;
  retryAction?: () => void;
} = {}) {
  return new TimeoutError({
    message,
    description: options.description || 'The request timed out',
    timeout: options.timeout,
    recovery: {
      type: RecoveryType.FORM_RETRY,
      label: 'Try Again',
      action: options.retryAction || (() => window.location.reload())
    }
  });
}

/**
 * Creates an authentication error
 */
export function createAuthError(message: string, options: {
  code?: AuthErrorCode;
  description?: string;
} = {}) {
  return new AuthenticationError({
    code: options.code || AuthErrorCode.UNAUTHENTICATED,
    message,
    description: options.description,
    recovery: {
      type: RecoveryType.SIGN_IN,
      label: 'Sign In',
      action: () => {
        window.location.href = '/auth';
      }
    }
  });
}

/**
 * Creates a submission error
 */
export function createSubmissionError(message: string, options: {
  code?: SubmissionErrorCode;
  description?: string;
  retryable?: boolean;
  retryAction?: () => void;
} = {}) {
  return new SubmissionError({
    code: options.code || SubmissionErrorCode.SERVER_ERROR,
    message,
    description: options.description,
    retryable: options.retryable ?? true,
    recovery: options.retryable !== false ? {
      type: RecoveryType.FORM_RETRY,
      label: 'Try Again',
      action: options.retryAction || (() => window.location.reload())
    } : undefined
  });
}

/**
 * Handles an error by applying consistent behavior based on error type
 */
export function handleAppError(error: Error | BaseApplicationError | unknown): void {
  console.error('Application error:', error);
  
  // Convert unknown errors to BaseApplicationError
  const appError = error instanceof BaseApplicationError
    ? error
    : new BaseApplicationError({
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
        category: ErrorCategory.UNKNOWN,
        retryable: false
      });
  
  // Log all errors (could be expanded to send to monitoring service)
  console.error(`[${appError.category}] [${appError.code}]: ${appError.message}`, appError);
  
  // This function implementation would normally show toasts or UI notifications
  // It's kept minimal here to focus on the error type additions
}
