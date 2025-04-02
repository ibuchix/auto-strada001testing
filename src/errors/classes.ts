
/**
 * Error classes for structured error handling
 * Created: 2025-12-01
 * Updated: 2028-05-18: Added missing error classes and fixed extension
 */

import { ErrorCategory, RecoveryAction, ValidationErrorCode, AuthErrorCode, SubmissionErrorCode, NetworkErrorCode } from './types';

interface BaseErrorOptions {
  message: string;
  code?: string;
  category?: ErrorCategory;
  description?: string;
  recovery?: RecoveryAction;
  retryable?: boolean;
}

export class BaseApplicationError extends Error {
  code: string;
  category: ErrorCategory;
  description?: string;
  recovery?: RecoveryAction;
  retryable: boolean;

  constructor({ 
    message, 
    code = 'UNKNOWN_ERROR', 
    category = ErrorCategory.GENERAL,
    description,
    recovery,
    retryable = true 
  }: BaseErrorOptions) {
    super(message);
    this.code = code;
    this.category = category;
    this.description = description;
    this.recovery = recovery;
    this.retryable = retryable;
    
    // Ensure instanceof works correctly
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
  }
}

interface ValidationErrorOptions extends BaseErrorOptions {
  code?: ValidationErrorCode;
}

export class ValidationError extends BaseApplicationError {
  constructor(options: ValidationErrorOptions) {
    super({
      ...options,
      category: ErrorCategory.VALIDATION,
      code: options.code || ValidationErrorCode.INVALID_FORMAT
    });
  }
}

interface FieldValidationErrorOptions extends ValidationErrorOptions {
  field: string;
}

export class FieldValidationError extends ValidationError {
  field: string;
  
  constructor({ field, ...options }: FieldValidationErrorOptions) {
    super({
      ...options,
      code: options.code || ValidationErrorCode.REQUIRED_FIELD
    });
    this.field = field;
  }
}

interface FormValidationErrorOptions extends ValidationErrorOptions {
  fields?: string[];
}

export class FormValidationError extends ValidationError {
  fields?: string[];
  
  constructor({ fields, ...options }: FormValidationErrorOptions) {
    super({
      ...options,
      code: options.code || ValidationErrorCode.INCOMPLETE_FORM
    });
    this.fields = fields;
  }
}

interface SubmissionErrorOptions extends BaseErrorOptions {
  code?: SubmissionErrorCode;
}

export class SubmissionError extends BaseApplicationError {
  constructor(options: SubmissionErrorOptions) {
    super({
      ...options,
      category: ErrorCategory.SUBMISSION,
      code: options.code || SubmissionErrorCode.SERVER_ERROR
    });
  }
}

interface NetworkErrorOptions extends BaseErrorOptions {
  code?: NetworkErrorCode;
}

export class NetworkError extends BaseApplicationError {
  constructor(options: NetworkErrorOptions) {
    super({
      ...options,
      category: ErrorCategory.NETWORK,
      code: options.code || NetworkErrorCode.CONNECTION_LOST
    });
  }
}

interface TimeoutErrorOptions extends NetworkErrorOptions {
  timeout?: number;
}

export class TimeoutError extends NetworkError {
  timeout?: number;
  
  constructor({ timeout, ...options }: TimeoutErrorOptions) {
    super({
      ...options,
      code: NetworkErrorCode.TIMEOUT
    });
    this.timeout = timeout;
  }
}

interface AuthenticationErrorOptions extends BaseErrorOptions {
  code?: AuthErrorCode;
}

export class AuthenticationError extends BaseApplicationError {
  constructor(options: AuthenticationErrorOptions) {
    super({
      ...options,
      category: ErrorCategory.AUTHENTICATION,
      code: options.code || AuthErrorCode.UNAUTHENTICATED
    });
  }
}
