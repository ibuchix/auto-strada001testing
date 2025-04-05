
/**
 * Error factory functions
 * Created: 2025-04-05
 */

import { useNavigate } from 'react-router-dom';
import { 
  AppError,
  ValidationError,
  NetworkError,
  AuthenticationError,
  AuthorizationError,
  ServerError,
  BusinessError
} from './classes';
import { 
  ErrorCode, 
  ErrorSeverity, 
  RecoveryAction,
  ErrorRecovery
} from './types';

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
    }
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
      handler: () => window.location.reload()
    }
  });
}

/**
 * Create an authentication error with standardized recovery
 */
export function createAuthenticationError(
  message: string = 'Authentication required',
  options: {
    code?: ErrorCode;
    severity?: ErrorSeverity;
    details?: Record<string, any>;
    recovery?: ErrorRecovery;
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
      route: '/auth'
    }
  });
}

/**
 * Create an authorization error with standardized recovery
 */
export function createAuthorizationError(
  message: string = 'You do not have permission to perform this action',
  options: {
    code?: ErrorCode;
    severity?: ErrorSeverity;
    details?: Record<string, any>;
    recovery?: ErrorRecovery;
  } = {}
): AuthorizationError {
  return new AuthorizationError({
    message,
    code: options.code || ErrorCode.UNAUTHORIZED,
    severity: options.severity || ErrorSeverity.ERROR,
    metadata: { details: options.details },
    recovery: options.recovery || {
      action: RecoveryAction.NAVIGATE,
      label: 'Go Home',
      route: '/'
    }
  });
}

/**
 * Create a server error with standardized recovery
 */
export function createServerError(
  message: string = 'Server error occurred',
  options: {
    code?: ErrorCode;
    severity?: ErrorSeverity;
    details?: Record<string, any>;
    recovery?: ErrorRecovery;
  } = {}
): ServerError {
  return new ServerError({
    message,
    code: options.code || ErrorCode.SERVER_ERROR,
    severity: options.severity || ErrorSeverity.ERROR,
    metadata: { details: options.details },
    recovery: options.recovery || {
      action: RecoveryAction.CONTACT_SUPPORT,
      label: 'Contact Support',
      handler: () => {
        window.location.href = 'mailto:support@autostrada.com?subject=Server%20Error';
      }
    }
  });
}

/**
 * Create a business logic error with standardized recovery
 */
export function createBusinessError(
  message: string,
  options: {
    code?: ErrorCode;
    severity?: ErrorSeverity;
    details?: Record<string, any>;
    recovery?: ErrorRecovery;
  } = {}
): BusinessError {
  return new BusinessError({
    message,
    code: options.code || ErrorCode.INVALID_OPERATION,
    severity: options.severity,
    metadata: { details: options.details },
    recovery: options.recovery
  });
}

/**
 * Create a valuation error with standardized recovery
 */
export function createValuationError(
  message: string,
  options: {
    code?: ErrorCode;
    severity?: ErrorSeverity;
    details?: Record<string, any>;
    recovery?: ErrorRecovery;
  } = {}
): BusinessError {
  return new BusinessError({
    message,
    code: options.code || ErrorCode.VALUATION_ERROR,
    severity: options.severity || ErrorSeverity.ERROR,
    metadata: { details: options.details },
    recovery: options.recovery || {
      action: RecoveryAction.MANUAL_RESOLUTION,
      label: 'Try Manual Valuation',
      route: '/manual-valuation'
    }
  });
}

/**
 * Create an error from unknown type
 */
export function createErrorFromUnknown(
  error: unknown, 
  defaultMessage: string = 'An unexpected error occurred'
): AppError {
  if (error instanceof AppError) {
    return error;
  }
  
  if (error instanceof Error) {
    return new AppError({
      message: error.message,
      code: ErrorCode.UNEXPECTED_ERROR,
      metadata: { originalError: error }
    });
  }
  
  // Handle network errors
  if (typeof error === 'object' && error !== null) {
    if ('status' in error && (error.status === 0 || error.status === 408)) {
      return createNetworkError(
        typeof error.message === 'string' ? error.message : 'Network request failed',
        { code: ErrorCode.REQUEST_TIMEOUT }
      );
    }
    
    if ('message' in error && typeof error.message === 'string') {
      return new AppError({
        message: error.message,
        code: ErrorCode.UNEXPECTED_ERROR,
        metadata: { originalError: error }
      });
    }
  }
  
  return new AppError({
    message: typeof error === 'string' ? error : defaultMessage,
    code: ErrorCode.UNEXPECTED_ERROR,
    metadata: { originalError: error }
  });
}
