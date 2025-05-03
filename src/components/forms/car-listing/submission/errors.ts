
/**
 * Submission Error Classes
 * Created: 2025-07-22
 * Updated: 2025-07-23 - Added SubmissionError parent class
 */

// Generic submission error class that other submission errors extend from
export class SubmissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SubmissionError';
  }
}

export class ValidationSubmissionError extends SubmissionError {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationSubmissionError';
  }
}

export class NetworkSubmissionError extends SubmissionError {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkSubmissionError';
  }
}

export class DatabaseSubmissionError extends SubmissionError {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseSubmissionError';
  }
}

export class FileUploadError extends SubmissionError {
  constructor(message: string) {
    super(message);
    this.name = 'FileUploadError';
  }
}
