
/**
 * Form submission errors
 * Created: 2025-07-12
 */

import { AppError } from '@/errors/classes';
import { ErrorCode, ErrorCategory, ErrorSeverity } from '@/errors/types';

export class SubmissionError extends AppError {
  constructor(message: string, code: ErrorCode = ErrorCode.SUBMISSION_ERROR) {
    super({
      message,
      code,
      category: ErrorCategory.BUSINESS,
      severity: ErrorSeverity.ERROR
    });
  }
}

export class ValidationSubmissionError extends SubmissionError {
  constructor(message: string) {
    super(message, ErrorCode.VALIDATION_ERROR);
    this.category = ErrorCategory.VALIDATION;
  }
}

export class NetworkSubmissionError extends SubmissionError {
  constructor(message: string) {
    super(message, ErrorCode.NETWORK_ERROR);
    this.category = ErrorCategory.NETWORK;
  }
}

export class FileUploadError extends SubmissionError {
  constructor(message: string) {
    super(message, ErrorCode.FILE_UPLOAD_ERROR);
  }
}

export class FormIncompleteError extends SubmissionError {
  constructor(message: string = 'Please complete all required fields before submitting') {
    super(message, ErrorCode.INCOMPLETE_FORM);
    this.category = ErrorCategory.VALIDATION;
  }
}
