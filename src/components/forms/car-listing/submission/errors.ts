
/**
 * Custom Error Classes
 * Created: 2025-05-03
 * Updated: 2025-07-02 - Added SubmissionError class
 */

import { ErrorCode, ErrorDetails } from "@/errors/types";

export class ValidationError extends Error {
  code: ErrorCode;
  description: string;
  
  constructor({ code, message, description = '' }: ErrorDetails) {
    super(message);
    this.name = 'ValidationError';
    this.code = code;
    this.description = description;
  }
}

export class SubmissionError extends Error {
  code: ErrorCode;
  description: string;
  
  constructor(message: string, { code = ErrorCode.SUBMISSION_ERROR, description = '' }: Partial<ErrorDetails> = {}) {
    super(message);
    this.name = 'SubmissionError';
    this.code = code;
    this.description = description;
  }
}
