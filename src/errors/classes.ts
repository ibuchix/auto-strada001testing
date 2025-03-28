
/**
 * Error class hierarchy for standardized application errors
 * Created: 2025-12-01
 * Purpose: Provides a consistent error structure throughout the application
 * Updated: 2024-08-16: Added ID property and improved error handling
 */

import { ErrorCategory, RecoveryType } from './types';

interface BaseErrorParams {
  code: string;
  message: string;
  description?: string;
  retryable?: boolean;
  metadata?: Record<string, any>;
  recovery?: {
    type: RecoveryType;
    label: string;
    field?: string;
    action: () => void;
  };
  category?: ErrorCategory;
  id?: string;
}

/**
 * Base application error class that all other error types extend
 */
export class BaseApplicationError extends Error {
  code: string;
  description?: string;
  retryable: boolean;
  metadata?: Record<string, any>;
  recovery?: {
    type: RecoveryType;
    label: string;
    field?: string;
    action: () => void;
  };
  category: ErrorCategory;
  id: string;

  constructor({
    code,
    message,
    description,
    retryable = false,
    metadata,
    recovery,
    category = ErrorCategory.UNKNOWN,
    id
  }: BaseErrorParams) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.description = description;
    this.retryable = retryable;
    this.metadata = metadata;
    this.recovery = recovery;
    this.category = category;
    // Generate UUID if ID is not provided
    this.id = id || crypto.randomUUID();

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

interface ValidationErrorParams extends BaseErrorParams {
  field?: string;
  fields?: string[];
}

/**
 * Base validation error for all validation-related errors
 */
export class ValidationError extends BaseApplicationError {
  constructor(params: ValidationErrorParams) {
    super({
      ...params,
      category: ErrorCategory.VALIDATION,
    });
    
    // Add field to metadata if provided
    if (params.field) {
      this.metadata = {
        ...this.metadata,
        field: params.field
      };
    }
    
    // Add fields to metadata if provided
    if (params.fields) {
      this.metadata = {
        ...this.metadata,
        fields: params.fields
      };
    }
  }
}

/**
 * Field-specific validation error
 */
export class FieldValidationError extends ValidationError {
  constructor(params: ValidationErrorParams) {
    super({
      ...params,
      recovery: params.recovery || {
        type: RecoveryType.FIELD_CORRECTION,
        label: 'Fix Field',
        field: params.field,
        action: () => {
          const element = document.getElementById(params.field as string);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            setTimeout(() => element.focus(), 100);
          }
        }
      }
    });
  }
}

/**
 * Form-level validation error (multiple fields)
 */
export class FormValidationError extends ValidationError {
  constructor(params: ValidationErrorParams) {
    super({
      ...params,
      recovery: params.recovery || {
        type: RecoveryType.FORM_RETRY,
        label: 'Fix Form',
        action: () => {
          window.scrollTo(0, 0);
        }
      }
    });
  }
}

interface SubmissionErrorParams extends BaseErrorParams {
  timeout?: number;
}

/**
 * Base submission error for all submission-related errors
 */
export class SubmissionError extends BaseApplicationError {
  timeout?: number;
  
  constructor(params: SubmissionErrorParams) {
    super({
      ...params,
      category: ErrorCategory.SUBMISSION,
      retryable: params.retryable ?? true
    });
    
    this.timeout = params.timeout;
  }
}

/**
 * Network-related submission error
 */
export class NetworkError extends SubmissionError {
  constructor(params: Omit<SubmissionErrorParams, 'code'>) {
    super({
      ...params,
      code: 'NETWORK_ERROR',
      recovery: params.recovery || {
        type: RecoveryType.REFRESH,
        label: 'Retry',
        action: () => window.location.reload()
      }
    });
  }
}

/**
 * Timeout-specific submission error
 */
export class TimeoutError extends SubmissionError {
  constructor(params: Omit<SubmissionErrorParams, 'code'>) {
    super({
      ...params,
      code: 'TIMEOUT',
      recovery: params.recovery || {
        type: RecoveryType.REFRESH,
        label: 'Try Again',
        action: () => window.location.reload()
      }
    });
  }
}

/**
 * Authentication-related errors
 */
export class AuthenticationError extends BaseApplicationError {
  constructor(params: BaseErrorParams) {
    super({
      ...params,
      category: ErrorCategory.AUTHENTICATION,
      recovery: params.recovery || {
        type: RecoveryType.SIGN_IN,
        label: 'Sign In',
        action: () => {
          window.location.href = '/auth';
        }
      }
    });
  }
}
