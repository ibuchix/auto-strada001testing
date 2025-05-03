
/**
 * Error factory for creating consistent application errors
 * Updated: 2025-07-03 - Fixed metadata handling
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  ErrorCode, 
  ErrorCategory, 
  ErrorSeverity, 
  ErrorOptions,
  RecoveryType,
  RecoveryAction,
  ErrorRecovery
} from './types';
import { AppError } from './classes';

class ErrorFactory {
  createError(
    message: string,
    code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
    options: ErrorOptions = {}
  ): AppError {
    const error = new AppError({
      message,
      code,
      category: this.getCategoryForCode(code),
      severity: options.severity || ErrorSeverity.ERROR,
      metadata: options.metadata || {}
    });
    
    return error;
  }
  
  createValidationError(
    message: string,
    metadata?: Record<string, any>
  ): AppError {
    return new AppError({
      message,
      code: ErrorCode.VALIDATION_ERROR,
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.WARNING,
      metadata: metadata || {}
    });
  }
  
  createNetworkError(
    message: string = 'Network error occurred',
    metadata?: Record<string, any>
  ): AppError {
    const error = new AppError({
      message,
      code: ErrorCode.NETWORK_ERROR,
      category: ErrorCategory.NETWORK,
      severity: ErrorSeverity.ERROR,
      metadata: metadata || {}
    });
    
    error.recovery = {
      type: RecoveryType.RETRY,
      label: 'Try Again',
      action: RecoveryAction.RETRY
    };
    
    return error;
  }
  
  createAuthError(
    message: string,
    code: ErrorCode = ErrorCode.AUTH_ERROR,
    metadata?: Record<string, any>
  ): AppError {
    const error = new AppError({
      message,
      code,
      category: ErrorCategory.AUTH,
      severity: ErrorSeverity.ERROR,
      metadata: metadata || {}
    });
    
    error.recovery = {
      type: RecoveryType.REDIRECT,
      label: 'Sign In',
      action: RecoveryAction.REDIRECT,
      url: '/auth/signin'
    };
    
    return error;
  }
  
  createFormError(
    message: string,
    fieldErrors?: Record<string, string>,
    metadata?: Record<string, any>
  ): AppError {
    const error = new AppError({
      message,
      code: ErrorCode.FORM_ERROR,
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.WARNING,
      metadata: { 
        ...metadata || {},
        fieldErrors
      }
    });
    
    // No recovery action for form errors, the user needs to fix the form inputs
    
    return error;
  }
  
  createTimeoutError(
    message: string = 'The request timed out',
    metadata?: Record<string, any>
  ): AppError {
    const error = new AppError({
      message,
      code: ErrorCode.TIMEOUT_ERROR,
      category: ErrorCategory.NETWORK,
      severity: ErrorSeverity.WARNING,
      metadata: metadata || {}
    });
    
    error.recovery = {
      type: RecoveryType.RETRY,
      label: 'Try Again',
      action: RecoveryAction.RETRY
    };
    
    return error;
  }
  
  createNotFoundError(
    message: string = 'Resource not found',
    metadata?: Record<string, any>
  ): AppError {
    const error = new AppError({
      message,
      code: ErrorCode.NOT_FOUND,
      category: ErrorCategory.BUSINESS,
      severity: ErrorSeverity.WARNING,
      metadata: metadata || {}
    });
    
    error.recovery = {
      type: RecoveryType.REDIRECT,
      label: 'Go Back',
      action: RecoveryAction.REDIRECT,
      url: '/'
    };
    
    return error;
  }
  
  createServerError(
    message: string = 'Server error occurred',
    metadata?: Record<string, any>
  ): AppError {
    const error = new AppError({
      message,
      code: ErrorCode.SERVER_ERROR,
      category: ErrorCategory.NETWORK,
      severity: ErrorSeverity.ERROR,
      metadata: metadata || {}
    });
    
    error.recovery = {
      type: RecoveryType.CONTACT_SUPPORT,
      label: 'Contact Support',
      action: RecoveryAction.CONTACT_SUPPORT
    };
    
    return error;
  }
  
  private getCategoryForCode(code: ErrorCode): ErrorCategory {
    switch (code) {
      case ErrorCode.VALIDATION_ERROR:
      case ErrorCode.FORM_ERROR:
        return ErrorCategory.VALIDATION;
        
      case ErrorCode.NETWORK_ERROR:
      case ErrorCode.TIMEOUT_ERROR:
      case ErrorCode.SERVER_ERROR:
        return ErrorCategory.NETWORK;
        
      case ErrorCode.AUTH_ERROR:
      case ErrorCode.INVALID_CREDENTIALS:
      case ErrorCode.EXPIRED_SESSION:
      case ErrorCode.UNAUTHORIZED:
      case ErrorCode.FORBIDDEN:
        return ErrorCategory.AUTH;
        
      case ErrorCode.SUBMISSION_ERROR:
      case ErrorCode.DATA_ERROR:
      case ErrorCode.PROCESSING_ERROR:
      case ErrorCode.FILE_UPLOAD_ERROR:
      case ErrorCode.INCOMPLETE_FORM:
      case ErrorCode.NOT_FOUND:
      case ErrorCode.VALUATION_ERROR:
        return ErrorCategory.BUSINESS;
        
      default:
        return ErrorCategory.TECHNICAL;
    }
  }
}

export const errorFactory = new ErrorFactory();
