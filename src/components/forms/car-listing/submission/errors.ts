
/**
 * Submission Error Classes
 * Created: 2025-07-22
 */

export class ValidationSubmissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationSubmissionError';
  }
}

export class NetworkSubmissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkSubmissionError';
  }
}

export class DatabaseSubmissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseSubmissionError';
  }
}

export class FileUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FileUploadError';
  }
}
