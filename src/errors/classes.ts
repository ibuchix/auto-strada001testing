
/**
 * Error classes
 * Created: 2025-07-02
 * Updated: 2025-07-10 - Added AppError class implementation
 */

import { ErrorCode, ErrorCategory, ErrorSeverity, ErrorRecovery, RecoveryType, AppErrorOptions } from '@/errors/types';
import { v4 as uuidv4 } from 'uuid';

export class AppError extends Error {
  id: string;
  code: ErrorCode;
  category: ErrorCategory;
  severity: ErrorSeverity;
  description?: string;
  recovery?: ErrorRecovery;
  stack?: string;
  metadata?: Record<string, any>;
  retryable: boolean;

  constructor(options: AppErrorOptions) {
    super(options.message);
    this.name = 'AppError';
    this.id = options.id || uuidv4();
    this.code = options.code || ErrorCode.UNKNOWN_ERROR;
    this.category = options.category || ErrorCategory.UNKNOWN;
    this.severity = options.severity || ErrorSeverity.ERROR;
    this.description = options.description;
    this.recovery = options.recovery;
    this.metadata = options.metadata || {};
    this.retryable = options.retryable !== undefined ? options.retryable : true;
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  /**
   * Create a serializable version of the error
   */
  serialize(): AppErrorOptions {
    return {
      id: this.id,
      message: this.message,
      code: this.code,
      category: this.category,
      severity: this.severity,
      description: this.description,
      recovery: this.recovery,
      metadata: this.metadata,
      retryable: this.retryable
    };
  }

  /**
   * Create a new instance with an updated description
   */
  withDescription(description: string): AppError {
    return new AppError({
      ...this.serialize(),
      description
    });
  }

  /**
   * Create a new instance with recovery options
   */
  withRecovery(recovery: ErrorRecovery): AppError {
    return new AppError({
      ...this.serialize(),
      recovery
    });
  }
}

export class ValidationError extends Error {
  code: ErrorCode;
  category: ErrorCategory;
  severity: ErrorSeverity;
  field?: string;
  metadata?: Record<string, any>;
  
  constructor(message: string, code: ErrorCode = ErrorCode.VALIDATION_ERROR, category: ErrorCategory = ErrorCategory.VALIDATION, severity: ErrorSeverity = ErrorSeverity.ERROR) {
    super(message);
    this.name = 'ValidationError';
    this.code = code;
    this.category = category;
    this.severity = severity;
    this.metadata = {};
  }
}

export class AuthenticationError extends Error {
  code: ErrorCode;
  category: ErrorCategory;
  severity: ErrorSeverity;
  
  constructor(message: string, code: ErrorCode = ErrorCode.AUTH_ERROR, severity: ErrorSeverity = ErrorSeverity.ERROR) {
    super(message);
    this.name = 'AuthenticationError';
    this.code = code;
    this.category = ErrorCategory.AUTHENTICATION;
    this.severity = severity;
  }
}

export class NetworkError extends Error {
  code: ErrorCode;
  category: ErrorCategory;
  severity: ErrorSeverity;
  
  constructor(message: string, code: ErrorCode = ErrorCode.NETWORK_ERROR, severity: ErrorSeverity = ErrorSeverity.ERROR) {
    super(message);
    this.name = 'NetworkError';
    this.code = code;
    this.category = ErrorCategory.NETWORK;
    this.severity = severity;
  }
}

export class SubmissionError extends Error {
  code: ErrorCode;
  description: string;
  
  constructor(message: string, { code = ErrorCode.SUBMISSION_ERROR, description = '' }: Partial<{code: ErrorCode; description: string}> = {}) {
    super(message);
    this.name = 'SubmissionError';
    this.code = code;
    this.description = description;
  }
}

// Business-related errors
export class BusinessError extends Error {
  code: ErrorCode;
  category: ErrorCategory;
  severity: ErrorSeverity;
  
  constructor(message: string, code: ErrorCode = ErrorCode.BUSINESS_ERROR, severity: ErrorSeverity = ErrorSeverity.ERROR) {
    super(message);
    this.name = 'BusinessError';
    this.code = code;
    this.category = ErrorCategory.BUSINESS;
    this.severity = severity;
  }
}

// Authorization-related errors
export class AuthorizationError extends Error {
  code: ErrorCode;
  category: ErrorCategory;
  severity: ErrorSeverity;
  
  constructor(message: string, code: ErrorCode = ErrorCode.AUTHORIZATION_ERROR, severity: ErrorSeverity = ErrorSeverity.ERROR) {
    super(message);
    this.name = 'AuthorizationError';
    this.code = code;
    this.category = ErrorCategory.AUTHORIZATION;
    this.severity = severity;
  }
}
