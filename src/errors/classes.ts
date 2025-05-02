
/**
 * Error Classes
 * Created: 2025-06-15
 * 
 * Custom error classes for application error handling
 */

import { 
  ErrorCategory,
  ErrorCode, 
  ErrorSeverity,
  RecoveryInfo
} from "./types";

export class AppError extends Error {
  code: ErrorCode;
  category: ErrorCategory;
  description: string;
  recovery?: RecoveryInfo;
  severity: ErrorSeverity;
  
  constructor({
    message,
    code = ErrorCode.UNKNOWN_ERROR,
    category = ErrorCategory.UNKNOWN,
    description = '',
    recovery,
    severity = ErrorSeverity.ERROR
  }: {
    message: string;
    code?: ErrorCode;
    category?: ErrorCategory;
    description?: string;
    recovery?: RecoveryInfo;
    severity?: ErrorSeverity;
  }) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.category = category;
    this.description = description;
    this.recovery = recovery;
    this.severity = severity;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, description: string = '') {
    super({
      message,
      code: ErrorCode.SCHEMA_VALIDATION_ERROR,
      category: ErrorCategory.VALIDATION,
      description,
      severity: ErrorSeverity.WARNING
    });
    this.name = 'ValidationError';
  }
}

export class NetworkError extends AppError {
  constructor(message: string) {
    super({
      message,
      code: ErrorCode.UNKNOWN_ERROR,
      category: ErrorCategory.NETWORK,
      severity: ErrorSeverity.ERROR
    });
    this.name = 'NetworkError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'You do not have permission to perform this action') {
    super({
      message,
      code: ErrorCode.UNKNOWN_ERROR,
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
      code: ErrorCode.UNKNOWN_ERROR,
      category: ErrorCategory.SERVER,
      severity: ErrorSeverity.ERROR
    });
    this.name = 'ServerError';
  }
}
