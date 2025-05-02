
/**
 * Error Classes
 * Created: 2025-06-15
 * Updated: 2025-06-16 - Added AuthenticationError class and improved type definitions
 * 
 * Custom error classes for application error handling
 */

import { 
  ErrorCategory,
  ErrorCode, 
  ErrorSeverity,
  ErrorRecovery
} from "./types";

export class AppError extends Error {
  code: ErrorCode;
  category: ErrorCategory;
  description: string;
  recovery?: ErrorRecovery;
  severity: ErrorSeverity;
  field?: string;
  metadata?: Record<string, any>;
  
  constructor({
    message,
    code = ErrorCode.UNKNOWN_ERROR,
    category = ErrorCategory.UNKNOWN,
    description = '',
    recovery,
    severity = ErrorSeverity.ERROR,
    field,
    metadata
  }: {
    message: string;
    code?: ErrorCode;
    category?: ErrorCategory;
    description?: string;
    recovery?: ErrorRecovery;
    severity?: ErrorSeverity;
    field?: string;
    metadata?: Record<string, any>;
  }) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.category = category;
    this.description = description;
    this.recovery = recovery;
    this.severity = severity;
    this.field = field;
    this.metadata = metadata;
  }
}

export class ValidationError extends AppError {
  constructor({
    message,
    code = ErrorCode.SCHEMA_VALIDATION_ERROR,
    field,
    description = '',
    severity = ErrorSeverity.WARNING,
    metadata,
    recovery
  }: {
    message: string;
    code?: ErrorCode;
    field?: string;
    description?: string;
    severity?: ErrorSeverity;
    metadata?: Record<string, any>;
    recovery?: ErrorRecovery;
  }) {
    super({
      message,
      code,
      category: ErrorCategory.VALIDATION,
      description,
      severity,
      field,
      metadata,
      recovery
    });
    this.name = 'ValidationError';
  }
}

export class NetworkError extends AppError {
  timeout?: number;

  constructor({
    message,
    code = ErrorCode.NETWORK_UNAVAILABLE,
    description = '',
    severity = ErrorSeverity.ERROR,
    recovery,
    metadata,
    timeout
  }: {
    message: string;
    code?: ErrorCode;
    description?: string;
    severity?: ErrorSeverity;
    recovery?: ErrorRecovery;
    metadata?: Record<string, any>;
    timeout?: number;
  }) {
    super({
      message,
      code,
      category: ErrorCategory.NETWORK,
      description,
      severity,
      recovery,
      metadata
    });
    this.name = 'NetworkError';
    this.timeout = timeout;
  }
}

export class AuthenticationError extends AppError {
  constructor({
    message = 'Authentication required',
    code = ErrorCode.UNAUTHENTICATED,
    description = '',
    severity = ErrorSeverity.ERROR,
    recovery,
    metadata
  }: {
    message?: string;
    code?: ErrorCode;
    description?: string;
    severity?: ErrorSeverity;
    recovery?: ErrorRecovery;
    metadata?: Record<string, any>;
  } = {}) {
    super({
      message,
      code,
      category: ErrorCategory.AUTHENTICATION,
      description,
      severity,
      recovery,
      metadata
    });
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'You do not have permission to perform this action') {
    super({
      message,
      code: ErrorCode.UNAUTHORIZED,
      category: ErrorCategory.AUTHORIZATION,
      severity: ErrorSeverity.ERROR
    });
    this.name = 'AuthorizationError';
  }
}

export class ServerError extends AppError {
  constructor(message: string = 'An unexpected server error occurred') {
    super({
      message,
      code: ErrorCode.SERVER_ERROR,
      category: ErrorCategory.SERVER,
      severity: ErrorSeverity.ERROR
    });
    this.name = 'ServerError';
  }
}

export class BusinessError extends AppError {
  constructor({ 
    message,
    code = ErrorCode.INVALID_OPERATION,
    description = '',
    recovery,
    severity = ErrorSeverity.ERROR
  }: {
    message: string;
    code?: ErrorCode;
    description?: string;
    recovery?: ErrorRecovery;
    severity?: ErrorSeverity;
  }) {
    super({
      message,
      code,
      category: ErrorCategory.BUSINESS,
      description,
      recovery,
      severity
    });
    this.name = 'BusinessError';
  }
}

export class SubmissionError extends AppError {
  retryable?: boolean;

  constructor({
    message,
    code = ErrorCode.SUBMISSION_ERROR,
    description = '',
    recovery,
    severity = ErrorSeverity.ERROR,
    retryable = true,
    metadata
  }: {
    message: string;
    code?: ErrorCode;
    description?: string;
    recovery?: ErrorRecovery;
    severity?: ErrorSeverity;
    retryable?: boolean;
    metadata?: Record<string, any>;
  }) {
    super({
      message,
      code,
      category: ErrorCategory.BUSINESS,
      description,
      recovery,
      severity,
      metadata
    });
    this.name = 'SubmissionError';
    this.retryable = retryable;
  }
}
