
/**
 * Updated 2028-05-15: Enhanced application error classes with additional types
 * Provides consistent error handling and recovery options
 */

import { ErrorCategory, RecoveryAction } from './types';

interface BaseErrorParams {
  message: string;
  code?: string;
  description?: string;
  category?: ErrorCategory;
  metadata?: Record<string, any>;
  recovery?: RecoveryAction;
  cause?: Error;
  retryable?: boolean; // Added retryable property
}

export class BaseApplicationError extends Error {
  id: string;
  code: string;
  description?: string;
  category: ErrorCategory;
  metadata?: Record<string, any>;
  recovery?: RecoveryAction;
  cause?: Error;
  retryable: boolean; // Added retryable property
  
  constructor(params: BaseErrorParams) {
    super(params.message);
    this.name = this.constructor.name;
    this.id = crypto.randomUUID();
    this.code = params.code || 'UNKNOWN_ERROR';
    this.description = params.description;
    this.category = params.category || ErrorCategory.GENERAL;
    this.metadata = params.metadata;
    this.recovery = params.recovery;
    this.cause = params.cause;
    this.retryable = params.retryable ?? true; // Default to true if not specified
    
    // Ensure stack trace captures the point of error creation
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends BaseApplicationError {
  constructor(params: Omit<BaseErrorParams, 'category'>) {
    super({
      ...params,
      category: ErrorCategory.VALIDATION
    });
    this.name = 'ValidationError';
  }
}

// Add field validation specific error
export class FieldValidationError extends ValidationError {
  field: string;
  
  constructor(params: Omit<BaseErrorParams, 'category'> & { field: string }) {
    super({
      ...params,
      metadata: { ...(params.metadata || {}), field: params.field }
    });
    this.name = 'FieldValidationError';
    this.field = params.field;
  }
}

// Add form validation specific error
export class FormValidationError extends ValidationError {
  fields?: string[];
  
  constructor(params: Omit<BaseErrorParams, 'category'> & { fields?: string[] }) {
    super({
      ...params,
      metadata: { ...(params.metadata || {}), fields: params.fields }
    });
    this.name = 'FormValidationError';
    this.fields = params.fields;
  }
}

export class SubmissionError extends BaseApplicationError {
  
  constructor(params: Omit<BaseErrorParams, 'category'>) {
    super({
      ...params,
      category: ErrorCategory.SUBMISSION
    });
    this.name = 'SubmissionError';
  }
}

export class NetworkError extends BaseApplicationError {
  constructor(params: Omit<BaseErrorParams, 'category'>) {
    super({
      ...params,
      category: ErrorCategory.NETWORK
    });
    this.name = 'NetworkError';
  }
}

// Add timeout specific error
export class TimeoutError extends NetworkError {
  timeout?: number;
  
  constructor(params: Omit<BaseErrorParams, 'category'> & { timeout?: number }) {
    super({
      ...params,
      code: params.code || 'TIMEOUT'
    });
    this.name = 'TimeoutError';
    this.timeout = params.timeout;
  }
}

export class AuthenticationError extends BaseApplicationError {
  constructor(params: Omit<BaseErrorParams, 'category'>) {
    super({
      ...params,
      category: ErrorCategory.AUTHENTICATION
    });
    this.name = 'AuthenticationError';
  }
}

// Helper function to normalize any error to BaseApplicationError
export function normalizeError(error: unknown): BaseApplicationError {
  if (error instanceof BaseApplicationError) {
    return error;
  }
  
  if (error instanceof Error) {
    return new BaseApplicationError({
      message: error.message,
      code: 'UNKNOWN_ERROR',
      description: error.stack,
      cause: error
    });
  }
  
  return new BaseApplicationError({
    message: typeof error === 'string' ? error : 'Unknown error occurred',
    code: 'UNKNOWN_ERROR',
    description: typeof error === 'object' ? JSON.stringify(error) : undefined
  });
}
