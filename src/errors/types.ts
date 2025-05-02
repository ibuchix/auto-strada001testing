
/**
 * Error Types
 * Created: 2025-05-03
 * 
 * TypeScript types for error handling
 */

export enum ErrorCode {
  SCHEMA_VALIDATION_ERROR = 'SCHEMA_VALIDATION_ERROR',
  INCOMPLETE_FORM = 'INCOMPLETE_FORM',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SERVER_VALIDATION_FAILED = 'SERVER_VALIDATION_FAILED',
  SUBMISSION_ERROR = 'SUBMISSION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface ErrorDetails {
  code: ErrorCode;
  message: string;
  description?: string;
}
