
/**
 * Error factory functions
 * Created: 2025-07-10
 * Updated: 2025-07-12 - Added createErrorFromUnknown function
 */

import { 
  AppError, 
  ValidationError, 
  NetworkError, 
  AuthenticationError
} from './classes';

import { 
  ErrorCategory, 
  ErrorCode, 
  ErrorSeverity, 
  RecoveryType, 
  ErrorRecovery 
} from './types';

/**
 * Create a generic AppError with standard behavior
 */
export function createAppError(
  message: string,
  options: {
    code?: ErrorCode;
    category?: ErrorCategory;
    description?: string;
    severity?: ErrorSeverity;
    metadata?: Record<string, any>;
    recovery?: ErrorRecovery;
  } = {}
): AppError {
  return new AppError({
    message,
    code: options.code || ErrorCode.UNKNOWN_ERROR,
    category: options.category || ErrorCategory.UNKNOWN,
    severity: options.severity || ErrorSeverity.ERROR,
    description: options.description,
    metadata: options.metadata,
    recovery: options.recovery
  });
}

/**
 * Create a validation error for a specific field
 */
export function createFieldError(
  field: string,
  message: string,
  options: {
    focus?: boolean;
    severity?: ErrorSeverity;
    metadata?: Record<string, any>;
  } = {}
): ValidationError {
  const error = new ValidationError(
    message,
    ErrorCode.VALIDATION_ERROR
  );
  
  error.field = field;
  error.metadata = {
    field,
    details: options.metadata || {},
    ...error.metadata
  };
  
  return error;
}

/**
 * Create a form validation error
 */
export function createFormError(
  message: string,
  options: {
    severity?: ErrorSeverity;
    metadata?: Record<string, any>;
  } = {}
): ValidationError {
  const error = new ValidationError(
    message,
    ErrorCode.VALIDATION_ERROR
  );
  
  error.metadata = {
    form: true,
    details: options.metadata || {},
    ...error.metadata
  };
  
  return error;
}

/**
 * Create a network error
 */
export function createNetworkError(
  message: string,
  options: {
    severity?: ErrorSeverity;
    metadata?: Record<string, any>;
    retryable?: boolean;
  } = {}
): NetworkError {
  const error = new NetworkError(
    message,
    ErrorCode.NETWORK_ERROR
  );
  
  error.metadata = options.metadata || {};
  
  return error;
}

/**
 * Create an authentication error
 */
export function createAuthError(
  message: string,
  options: {
    severity?: ErrorSeverity;
    metadata?: Record<string, any>;
  } = {}
): AuthenticationError {
  const error = new AuthenticationError(
    message,
    ErrorCode.AUTH_ERROR
  );
  
  error.metadata = options.metadata || {};
  
  return error;
}

/**
 * Create a submission error
 */
export function createSubmissionError(
  message: string,
  options: {
    severity?: ErrorSeverity;
    metadata?: Record<string, any>;
  } = {}
): AppError {
  return new AppError({
    message,
    code: ErrorCode.SUBMISSION_ERROR,
    category: ErrorCategory.BUSINESS,
    severity: options.severity || ErrorSeverity.ERROR,
    metadata: options.metadata || {}
  });
}

/**
 * Create a timeout error
 */
export function createTimeoutError(
  message: string,
  options: {
    severity?: ErrorSeverity;
    metadata?: Record<string, any>;
  } = {}
): NetworkError {
  const error = new NetworkError(
    message || 'The operation timed out',
    ErrorCode.NETWORK_ERROR
  );
  
  error.metadata = {
    type: 'timeout',
    ...options.metadata
  };
  
  return error;
}

/**
 * Create an error from an unknown source
 */
export function createErrorFromUnknown(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }
  
  if (error instanceof Error) {
    return new AppError({
      message: error.message,
      code: ErrorCode.UNKNOWN_ERROR,
      category: ErrorCategory.UNKNOWN
    });
  }
  
  return new AppError({
    message: String(error),
    code: ErrorCode.UNKNOWN_ERROR,
    category: ErrorCategory.UNKNOWN
  });
}

/**
 * Handle an AppError with standard behavior
 */
export function handleAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }
  
  return createAppError(
    error instanceof Error ? error.message : String(error)
  );
}
