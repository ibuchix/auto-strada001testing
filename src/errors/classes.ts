
/**
 * Error Classes
 * Updated: 2025-06-23 - Added missing methods to AppError class and fixed type issues
 */

import { 
  ErrorCode,
  ErrorCategory, 
  ErrorSeverity,
  ErrorRecovery,
  AppError as IAppError
} from './types';

export class AppError implements IAppError {
  public message: string;
  public code: ErrorCode;
  public description?: string;
  public category: ErrorCategory;
  public recovery?: ErrorRecovery;
  public severity: ErrorSeverity;
  public field?: string;
  public metadata?: Record<string, any>;
  public id: string;
  public timestamp: string;
  public retryable: boolean;

  constructor(options: {
    message: string;
    code?: ErrorCode;
    category?: ErrorCategory;
    description?: string;
    recovery?: ErrorRecovery;
    severity?: ErrorSeverity;
    field?: string;
    metadata?: Record<string, any>;
    retryable?: boolean;
  }) {
    this.message = options.message;
    this.code = options.code || ErrorCode.UNKNOWN_ERROR;
    this.category = options.category || ErrorCategory.GENERAL;
    this.description = options.description;
    this.recovery = options.recovery;
    this.severity = options.severity || ErrorSeverity.ERROR;
    this.field = options.field;
    this.metadata = options.metadata || {};
    this.id = crypto.randomUUID();
    this.timestamp = new Date().toISOString();
    this.retryable = options.retryable !== undefined ? options.retryable : true;
  }

  // Method to serialize the error for logging
  serialize(): Record<string, any> {
    return {
      id: this.id,
      message: this.message,
      code: this.code,
      category: this.category,
      description: this.description,
      severity: this.severity,
      field: this.field,
      metadata: this.metadata,
      timestamp: this.timestamp,
      retryable: this.retryable
    };
  }

  // Method to create a new error with a modified description
  withDescription(description: string): AppError {
    return new AppError({
      ...this,
      description
    });
  }

  // Method to create a new error with modified recovery options
  withRecovery(recovery: ErrorRecovery): AppError {
    return new AppError({
      ...this,
      recovery
    });
  }
}

// Extension classes for specialized error types
export class ValidationError extends AppError {
  constructor(message: string, code: ErrorCode = ErrorCode.VALIDATION_ERROR, field?: string, metadata?: Record<string, any>) {
    super({
      message,
      code,
      category: ErrorCategory.VALIDATION,
      field,
      metadata
    });
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string, code: ErrorCode = ErrorCode.AUTH_ERROR) {
    super({
      message,
      code,
      category: ErrorCategory.AUTHENTICATION
    });
  }
}

export class NetworkError extends AppError {
  constructor(message: string, code: ErrorCode = ErrorCode.NETWORK_ERROR) {
    super({
      message,
      code,
      category: ErrorCategory.NETWORK
    });
  }
}

export class ServerError extends AppError {
  constructor(message: string, code: ErrorCode = ErrorCode.SERVER_ERROR) {
    super({
      message,
      code,
      category: ErrorCategory.SERVER
    });
  }
}

export class SubmissionError extends AppError {
  constructor(message: string, code: ErrorCode = ErrorCode.SUBMISSION_ERROR, metadata?: Record<string, any>) {
    super({
      message,
      code,
      category: ErrorCategory.BUSINESS,
      metadata
    });
  }
}
