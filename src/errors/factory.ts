
/**
 * Error Factory
 * Created: 2025-07-03
 * Updated: 2025-07-18 - Added createErrorFromUnknown method
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  ErrorCode, 
  ErrorCategory, 
  ErrorSeverity, 
  RecoveryType,
  RecoveryAction,
  ErrorRecovery,
  AppErrorOptions
} from './types';
import { 
  AppError, 
  ValidationError, 
  AuthenticationError, 
  NetworkError,
  BusinessError
} from './classes';

export const errorFactory = {
  createAppError(
    message: string,
    code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.ERROR
  ): AppError {
    return new AppError({
      message,
      code,
      category,
      severity
    });
  },
  
  createFormError(
    message: string,
    errors: Record<string, string> = {},
    metadata: Record<string, any> = {}
  ): AppError {
    return new AppError({
      message,
      code: ErrorCode.FORM_ERROR,
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.ERROR,
      metadata: {
        ...metadata,
        formErrors: errors
      }
    });
  },
  
  createValidationError(
    message: string,
    field?: string,
  ): ValidationError {
    const validationError = new ValidationError(
      message,
      ErrorCode.VALIDATION_ERROR,
      ErrorCategory.VALIDATION
    );
    
    if (field) {
      validationError.field = field;
    }
    
    return validationError;
  },
  
  createAuthError(
    message: string,
    code: ErrorCode = ErrorCode.AUTH_ERROR
  ): AuthenticationError {
    return new AuthenticationError(message, code);
  },

  createNetworkError(message: string): NetworkError {
    return new NetworkError(message);
  },

  createTimeoutError(message: string = 'Request timed out'): NetworkError {
    return new NetworkError(message, ErrorCode.TIMEOUT_ERROR);
  },
  
  createSubmissionError(message: string, description: string = ''): AppError {
    return new AppError({
      message,
      code: ErrorCode.SUBMISSION_ERROR,
      category: ErrorCategory.BUSINESS,
      severity: ErrorSeverity.ERROR,
      description
    });
  },
  
  createErrorFromUnknown(error: unknown): AppError {
    if (error instanceof AppError) {
      return error;
    }
    
    if (error instanceof Error) {
      const appError = new AppError({
        message: error.message,
        code: ErrorCode.UNKNOWN_ERROR,
        category: ErrorCategory.UNKNOWN,
        severity: ErrorSeverity.ERROR
      });
      
      // Copy the stack trace if available
      if (error.stack) {
        appError.stack = error.stack;
      }
      
      return appError;
    }
    
    // If it's a string, use it as the message
    if (typeof error === 'string') {
      return new AppError({
        message: error,
        code: ErrorCode.UNKNOWN_ERROR,
        category: ErrorCategory.UNKNOWN,
        severity: ErrorSeverity.ERROR
      });
    }
    
    // If it's an object, try to extract a message
    if (error && typeof error === 'object') {
      if ('message' in error && typeof error.message === 'string') {
        return new AppError({
          message: error.message,
          code: ErrorCode.UNKNOWN_ERROR,
          category: ErrorCategory.UNKNOWN,
          severity: ErrorSeverity.ERROR
        });
      }
    }
    
    // Last resort - generic error
    return new AppError({
      message: 'An unknown error occurred',
      code: ErrorCode.UNKNOWN_ERROR,
      category: ErrorCategory.UNKNOWN,
      severity: ErrorSeverity.ERROR
    });
  },

  handleAppError(error: any): void {
    console.error("App Error:", error);
    // Additional error handling logic can be added here
  }
};

// Convenience exports for direct import
export const { 
  createAppError,
  createFormError, 
  createValidationError,
  createAuthError,
  createNetworkError,
  createTimeoutError,
  createSubmissionError,
  createErrorFromUnknown,
  handleAppError
} = errorFactory;
