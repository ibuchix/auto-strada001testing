
/**
 * Error classes for the application
 * Created: 2025-12-01
 * Purpose: Provides standard error classes for consistent error handling
 */

import { 
  AppError, 
  ErrorCategory, 
  ErrorRecovery, 
  ValidationErrorCode,
  SubmissionErrorCode,
  AuthErrorCode
} from './types';

/**
 * Base application error class
 */
export class BaseApplicationError extends Error implements AppError {
  code: string;
  category: ErrorCategory;
  description?: string;
  retryable: boolean;
  metadata?: Record<string, any>;
  recovery?: ErrorRecovery;

  constructor(options: {
    code: string;
    message: string;
    category: ErrorCategory;
    description?: string;
    retryable?: boolean;
    metadata?: Record<string, any>;
    recovery?: ErrorRecovery;
  }) {
    super(options.message);
    this.name = 'ApplicationError';
    this.code = options.code;
    this.category = options.category;
    this.description = options.description;
    this.retryable = options.retryable ?? false;
    this.metadata = options.metadata;
    this.recovery = options.recovery;

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, BaseApplicationError.prototype);
  }
}

/**
 * Validation error for handling form and data validation failures
 */
export class ValidationError extends BaseApplicationError {
  constructor(options: {
    code: ValidationErrorCode | string;
    message: string;
    description?: string;
    field?: string;
    recovery?: ErrorRecovery;
    metadata?: Record<string, any>;
  }) {
    super({
      code: options.code,
      message: options.message,
      category: ErrorCategory.VALIDATION,
      description: options.description,
      retryable: true,
      metadata: {
        field: options.field,
        ...options.metadata
      },
      recovery: options.recovery
    });
    this.name = 'ValidationError';

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Field validation error specifically for form field validation issues
 */
export class FieldValidationError extends ValidationError {
  field: string;

  constructor(options: {
    field: string;
    message: string;
    code?: ValidationErrorCode | string;
    description?: string;
    recovery?: ErrorRecovery;
  }) {
    super({
      code: options.code || ValidationErrorCode.INVALID_FORMAT,
      message: options.message,
      description: options.description,
      field: options.field,
      recovery: options.recovery
    });
    this.name = 'FieldValidationError';
    this.field = options.field;

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, FieldValidationError.prototype);
  }
}

/**
 * Form validation error for validation issues affecting the entire form
 */
export class FormValidationError extends ValidationError {
  constructor(options: {
    message: string;
    code?: ValidationErrorCode | string;
    description?: string;
    fields?: string[];
    recovery?: ErrorRecovery;
  }) {
    super({
      code: options.code || ValidationErrorCode.INCOMPLETE_FORM,
      message: options.message,
      description: options.description,
      recovery: options.recovery,
      metadata: {
        fields: options.fields
      }
    });
    this.name = 'FormValidationError';

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, FormValidationError.prototype);
  }
}

/**
 * Submission error for handling API and data submission failures
 */
export class SubmissionError extends BaseApplicationError {
  constructor(options: {
    code: SubmissionErrorCode | string;
    message: string;
    description?: string;
    retryable?: boolean;
    metadata?: Record<string, any>;
    recovery?: ErrorRecovery;
  }) {
    super({
      code: options.code,
      message: options.message,
      category: ErrorCategory.SUBMISSION,
      description: options.description,
      retryable: options.retryable ?? true,
      metadata: options.metadata,
      recovery: options.recovery
    });
    this.name = 'SubmissionError';

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, SubmissionError.prototype);
  }
}

/**
 * Network error for handling connectivity issues
 */
export class NetworkError extends SubmissionError {
  constructor(options: {
    message: string;
    description?: string;
    recovery?: ErrorRecovery;
    metadata?: Record<string, any>;
  }) {
    super({
      code: SubmissionErrorCode.NETWORK_ERROR,
      message: options.message,
      description: options.description || 'A network error occurred while submitting your request',
      retryable: true,
      recovery: options.recovery,
      metadata: options.metadata
    });
    this.name = 'NetworkError';

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Timeout error for handling request timeouts
 */
export class TimeoutError extends SubmissionError {
  constructor(options: {
    message: string;
    description?: string;
    recovery?: ErrorRecovery;
    timeout?: number;
  }) {
    super({
      code: SubmissionErrorCode.TIMEOUT,
      message: options.message,
      description: options.description || 'The request timed out',
      retryable: true,
      recovery: options.recovery,
      metadata: {
        timeout: options.timeout
      }
    });
    this.name = 'TimeoutError';

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

/**
 * Authentication error for handling auth-related issues
 */
export class AuthenticationError extends BaseApplicationError {
  constructor(options: {
    code: AuthErrorCode | string;
    message: string;
    description?: string;
    recovery?: ErrorRecovery;
  }) {
    super({
      code: options.code,
      message: options.message,
      category: ErrorCategory.AUTHENTICATION,
      description: options.description,
      retryable: false,
      recovery: options.recovery
    });
    this.name = 'AuthenticationError';

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}
