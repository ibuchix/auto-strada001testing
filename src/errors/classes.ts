
/**
 * Created 2028-05-15: Base application error classes
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
}

export class BaseApplicationError extends Error {
  id: string;
  code: string;
  description?: string;
  category: ErrorCategory;
  metadata?: Record<string, any>;
  recovery?: RecoveryAction;
  cause?: Error;
  
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

export class SubmissionError extends BaseApplicationError {
  retryable: boolean;
  
  constructor(params: Omit<BaseErrorParams, 'category'> & { retryable?: boolean }) {
    super({
      ...params,
      category: ErrorCategory.SUBMISSION
    });
    this.name = 'SubmissionError';
    this.retryable = params.retryable ?? false;
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
