
/**
 * Submission Error Classes
 * Created: 2025-07-22
 * Updated: 2025-07-23 - Added SubmissionError parent class
 * Updated: 2025-05-10 - Updated to use global ErrorCategory type
 */

import { ErrorCategory } from '@/errors/types';

// Generic submission error class that other submission errors extend from
export class SubmissionError extends Error {
  category: ErrorCategory;
  
  constructor(message: string, category: ErrorCategory = ErrorCategory.BUSINESS) {
    super(message);
    this.name = 'SubmissionError';
    this.category = category;
  }
}

export class ValidationSubmissionError extends SubmissionError {
  constructor(message: string) {
    super(message, ErrorCategory.VALIDATION);
    this.name = 'ValidationSubmissionError';
  }
}

export class NetworkSubmissionError extends SubmissionError {
  constructor(message: string) {
    super(message, ErrorCategory.NETWORK);
    this.name = 'NetworkSubmissionError';
  }
}

export class DatabaseSubmissionError extends SubmissionError {
  constructor(message: string) {
    super(message, ErrorCategory.DATABASE);
    this.name = 'DatabaseSubmissionError';
  }
}

export class FileUploadError extends SubmissionError {
  constructor(message: string) {
    super(message, ErrorCategory.BUSINESS);
    this.name = 'FileUploadError';
  }
}
