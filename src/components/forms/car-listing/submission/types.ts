
/**
 * Submission Types
 * Updated: 2025-05-04 - Fixed TypeScript errors with missing AppError type
 * Updated: 2025-05-07 - Added missing ErrorCategory enum values
 * Updated: 2025-05-08 - Fixed error category types and validation
 * Updated: 2025-05-09 - Fixed ErrorCategory type compatibility and export
 */

export type SubmissionErrorType = 'validation' | 'auth' | 'service' | 'network';

export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTH = 'auth',
  TECHNICAL = 'technical',
  BUSINESS = 'business',
  GENERAL = 'general'
}

export interface FormSubmissionResult {
  success: boolean;
  data?: any;
  error?: string;
}

export class AppError extends Error {
  id: string;
  code: string;
  category: ErrorCategory;
  severity: 'low' | 'medium' | 'high' | 'critical';
  contextData?: any;
  userMessage?: string;
  timestamp: string;
  
  constructor(message: string, code: string, category: ErrorCategory, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium') {
    super(message);
    this.name = 'AppError';
    this.id = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.code = code;
    this.category = category;
    this.severity = severity;
    this.timestamp = new Date().toISOString();
  }
}

export class SubmissionError extends AppError {
  constructor(message: string, code: string, category: ErrorCategory = ErrorCategory.TECHNICAL) {
    super(message, code, category);
    this.name = 'SubmissionError';
  }
}

export class ValidationSubmissionError extends SubmissionError {
  validationErrors: string[];
  
  constructor(message: string, validationErrors: string[] = []) {
    super(message, 'VAL_ERROR', ErrorCategory.VALIDATION);
    this.name = 'ValidationSubmissionError';
    this.validationErrors = validationErrors;
  }
}
