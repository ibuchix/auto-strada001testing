
/**
 * Error factory functions
 * Created: 2025-04-05
 * Updated: 2025-04-05 - Fixed TypeScript type issues and enum references
 */

import { 
  AppError,
  ValidationError,
  NetworkError,
  AuthenticationError,
  AuthorizationError,
  ServerError,
  BusinessError,
  SubmissionError
} from './classes';
import { 
  ErrorCode, 
  ErrorCategory,
  ErrorSeverity, 
  RecoveryAction,
  ErrorRecovery,
  RecoveryType
} from './types';

/**
 * Create an error from an unknown error source
 */
export function createErrorFromUnknown(error: unknown): AppError {
  // If it's already an AppError, return it
  if (error instanceof AppError) {
    return error;
  }
  
  // Handle standard Error objects
  if (error instanceof Error) {
    return new AppError({
      message: error.message,
      code: ErrorCode.UNEXPECTED_ERROR,
      category: determineErrorCategory(error),
      metadata: {
        originalError: error,
        stack: error.stack
      }
    });
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return new AppError({
      message: error,
      code: ErrorCode.UNEXPECTED_ERROR,
      category: ErrorCategory.UNKNOWN
    });
  }
  
  // Handle objects with status and messages (like HTTP errors)
  if (error && typeof error === 'object' && 'status' in error) {
    let category = ErrorCategory.SERVER;
    let code = ErrorCode.SERVER_ERROR;
    const status = Number(error.status);
    
    // Determine category and code based on status
    if (status === 401 || status === 403) {
      category = ErrorCategory.AUTHENTICATION;
      code = status === 401 ? ErrorCode.UNAUTHENTICATED : ErrorCode.UNAUTHORIZED;
    } else if (status === 404) {
      category = ErrorCategory.BUSINESS;
      code = ErrorCode.RESOURCE_NOT_FOUND;
    } else if (status >= 400 && status < 500) {
      category = ErrorCategory.CLIENT;
      code = ErrorCode.INVALID_OPERATION;
    }
    
    let message = 'An error occurred';
    if ('message' in error && error.message && typeof error.message === 'string') {
      message = error.message;
    }
    
    return new AppError({
      message,
      code,
      category,
      metadata: {
        originalError: error,
        status
      }
    });
  }
  
  // Fallback for any other type
  return new AppError({
    message: 'An unknown error occurred',
    code: ErrorCode.UNKNOWN_ERROR,
    category: ErrorCategory.UNKNOWN,
    metadata: {
      originalError: error
    }
  });
}

/**
 * Handle application errors with standardized approach
 */
export function handleAppError(error: unknown): AppError {
  const appError = createErrorFromUnknown(error);
  console.error(`[ERROR][${appError.category}][${appError.code}]`, appError.message, appError);
  return appError;
}

/**
 * Create a validation error with standardized recovery
 */
export function createValidationError(
  message: string,
  options: {
    code?: ErrorCode;
    field?: string;
    severity?: ErrorSeverity;
    details?: Record<string, any>;
    recovery?: ErrorRecovery;
    description?: string;
  } = {}
): ValidationError {
  return new ValidationError({
    message,
    code: options.code || ErrorCode.INVALID_VALUE,
    field: options.field,
    severity: options.severity,
    metadata: { details: options.details },
    recovery: options.recovery || {
      action: RecoveryAction.RETRY,
      label: 'Try Again'
    },
    description: options.description
  });
}

/**
 * Create a field validation error
 */
export function createFieldError(
  field: string,
  message: string,
  options: {
    code?: ErrorCode;
    focus?: boolean;
    details?: Record<string, any>;
    description?: string;
  } = {}
): ValidationError {
  return new ValidationError({
    message,
    code: options.code || ErrorCode.INVALID_VALUE,
    field,
    metadata: { details: options.details },
    recovery: {
      action: RecoveryAction.RETRY,
      label: 'Fix Field',
      type: RecoveryType.FIELD_CORRECTION
    },
    description: options.description
  });
}

/**
 * Create a form validation error
 */
export function createFormError(
  message: string,
  options: {
    code?: ErrorCode;
    details?: Record<string, any>;
    recovery?: ErrorRecovery;
    description?: string;
  } = {}
): ValidationError {
  return new ValidationError({
    message,
    code: options.code || ErrorCode.INVALID_VALUE,
    metadata: { details: options.details },
    recovery: options.recovery || {
      action: RecoveryAction.RETRY,
      label: 'Check Form',
      type: RecoveryType.FORM_RETRY
    },
    description: options.description
  });
}

/**
 * Create a network error with standardized recovery
 */
export function createNetworkError(
  message: string = 'Network connection error',
  options: {
    code?: ErrorCode;
    severity?: ErrorSeverity;
    details?: Record<string, any>;
    recovery?: ErrorRecovery;
    description?: string;
    timeout?: number;
  } = {}
): NetworkError {
  return new NetworkError({
    message,
    code: options.code || ErrorCode.NETWORK_UNAVAILABLE,
    severity: options.severity || ErrorSeverity.ERROR,
    metadata: { details: options.details },
    recovery: options.recovery || {
      action: RecoveryAction.RETRY,
      label: 'Try Again',
      type: RecoveryType.REFRESH
    },
    description: options.description,
    timeout: options.timeout
  });
}

/**
 * Create a timeout error
 */
export function createTimeoutError(
  message: string = 'Request timed out',
  options: {
    code?: ErrorCode;
    details?: Record<string, any>;
    recovery?: ErrorRecovery;
    timeout?: number;
  } = {}
): NetworkError {
  return new NetworkError({
    message,
    code: options.code || ErrorCode.REQUEST_TIMEOUT,
    metadata: { details: options.details },
    recovery: options.recovery || {
      action: RecoveryAction.RETRY,
      label: 'Try Again',
      type: RecoveryType.REFRESH
    },
    timeout: options.timeout
  });
}

/**
 * Create an authentication error with standardized recovery
 */
export function createAuthError(
  message: string = 'Authentication required',
  options: {
    code?: ErrorCode;
    severity?: ErrorSeverity;
    details?: Record<string, any>;
    recovery?: ErrorRecovery;
    description?: string;
  } = {}
): AuthenticationError {
  return new AuthenticationError({
    message,
    code: options.code || ErrorCode.UNAUTHENTICATED,
    severity: options.severity || ErrorSeverity.ERROR,
    metadata: { details: options.details },
    recovery: options.recovery || {
      action: RecoveryAction.AUTHENTICATE,
      label: 'Sign In',
      route: '/auth',
      type: RecoveryType.SIGN_IN
    },
    description: options.description
  });
}

/**
 * Create a submission error
 */
export function createSubmissionError(
  message: string,
  options: {
    code?: ErrorCode;
    severity?: ErrorSeverity;
    details?: Record<string, any>;
    recovery?: ErrorRecovery;
    description?: string;
    retryable?: boolean;
  } = {}
): SubmissionError {
  return new SubmissionError({
    message,
    code: options.code || ErrorCode.SUBMISSION_ERROR,
    severity: options.severity || ErrorSeverity.ERROR,
    metadata: { details: options.details },
    recovery: options.recovery || {
      action: RecoveryAction.RETRY,
      label: 'Try Again',
      type: RecoveryType.FORM_RETRY
    },
    description: options.description,
    retryable: options.retryable
  });
}

/**
 * Determine error category based on error content
 */
function determineErrorCategory(error: Error): ErrorCategory {
  const errorName = error.name.toLowerCase();
  const errorMessage = error.message.toLowerCase();
  
  if (errorName.includes('network') || 
      errorMessage.includes('network') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('offline')) {
    return ErrorCategory.NETWORK;
  }
  
  if (errorName.includes('auth') || 
      errorMessage.includes('auth') ||
      errorMessage.includes('login') ||
      errorMessage.includes('permission')) {
    return ErrorCategory.AUTHENTICATION;
  }
  
  if (errorName.includes('valid') || 
      errorMessage.includes('valid') ||
      errorMessage.includes('required') ||
      errorMessage.includes('invalid')) {
    return ErrorCategory.VALIDATION;
  }
  
  if (errorName.includes('server') || 
      errorMessage.includes('server') ||
      errorMessage.includes('500')) {
    return ErrorCategory.SERVER;
  }
  
  return ErrorCategory.UNKNOWN;
}
