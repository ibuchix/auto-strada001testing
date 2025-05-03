
/**
 * Error classes
 * Created: 2025-07-02
 */

import { ErrorCode, ErrorCategory, ErrorSeverity } from '@/errors/types';

export class ValidationError extends Error {
  code: ErrorCode;
  category: ErrorCategory;
  severity: ErrorSeverity;
  field?: string;
  
  constructor(message: string, code: ErrorCode = ErrorCode.VALIDATION_ERROR, category: ErrorCategory = ErrorCategory.VALIDATION, severity: ErrorSeverity = ErrorSeverity.ERROR) {
    super(message);
    this.name = 'ValidationError';
    this.code = code;
    this.category = category;
    this.severity = severity;
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
