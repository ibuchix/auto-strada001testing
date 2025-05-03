
/**
 * Car listing submission specific error types
 * Created: 2025-07-18
 */

import { AppError } from '@/errors/classes';
import { ErrorCode, ErrorCategory, ErrorSeverity, AppErrorParams } from '@/errors/types';

export class ValidationSubmissionError extends AppError {
  field?: string;

  constructor(params: AppErrorParams | string) {
    // Handle both string and object constructor patterns
    if (typeof params === 'string') {
      super({
        message: params,
        code: ErrorCode.VALIDATION_ERROR,
        category: ErrorCategory.VALIDATION,
        severity: ErrorSeverity.ERROR
      });
    } else {
      super(params);
    }
    
    this.name = 'ValidationSubmissionError';
  }
  
  withField(field: string): this {
    this.field = field;
    return this;
  }
}

export class NetworkSubmissionError extends AppError {
  constructor(params: AppErrorParams | string) {
    // Handle both string and object constructor patterns
    if (typeof params === 'string') {
      super({
        message: params,
        code: ErrorCode.NETWORK_ERROR,
        category: ErrorCategory.NETWORK,
        severity: ErrorSeverity.ERROR
      });
    } else {
      super(params);
    }
    
    this.name = 'NetworkSubmissionError';
  }
}

export class FormSubmissionError extends AppError {
  constructor(params: AppErrorParams | string) {
    // Handle both string and object constructor patterns
    if (typeof params === 'string') {
      super({
        message: params,
        code: ErrorCode.SUBMISSION_ERROR,
        category: ErrorCategory.BUSINESS,
        severity: ErrorSeverity.ERROR
      });
    } else {
      super(params);
    }
    
    this.name = 'FormSubmissionError';
  }
}
