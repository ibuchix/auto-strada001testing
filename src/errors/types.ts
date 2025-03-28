
/**
 * Core error types and interfaces for the application
 * Created: 2025-12-01
 * Purpose: Provides standardized error types for consistent error handling
 * Updated: 2024-08-16: Updated ErrorCategory to be string type
 */

/**
 * Base error interface that all application errors should implement
 */
export interface AppError {
  code: string;           // Machine-readable error code
  message: string;        // User-friendly error message
  description?: string;   // Detailed explanation
  retryable?: boolean;    // Whether this error can be retried
  metadata?: Record<string, any>; // Additional debugging data
  recovery?: ErrorRecovery; // Recovery options
  id?: string;            // Unique identifier for the error
}

/**
 * Error categories for classification
 */
export enum ErrorCategory {
  VALIDATION = 'validation',
  SUBMISSION = 'submission',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NETWORK = 'network',
  DATABASE = 'database',
  BUSINESS_LOGIC = 'business_logic',
  SYSTEM = 'system',
  UNKNOWN = 'unknown'
}

/**
 * Recovery types for guiding UI behavior when errors occur
 */
export enum RecoveryType {
  FIELD_CORRECTION = 'field_correction', // User should fix a specific field
  FORM_RETRY = 'form_retry',           // User should retry submitting the form
  SIGN_IN = 'sign_in',                 // User needs to sign in
  NAVIGATE = 'navigate',               // User should navigate to another page
  REFRESH = 'refresh',                 // User should refresh the page
  CONTACT_SUPPORT = 'contact_support', // User should contact support
  NONE = 'none'                       // No recovery action available
}

/**
 * Recovery action for errors
 */
export interface ErrorRecovery {
  type: RecoveryType;
  label: string;
  field?: string;
  action: () => void;
}

/**
 * Validation error codes
 */
export enum ValidationErrorCode {
  REQUIRED_FIELD = 'REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  INVALID_VIN = 'INVALID_VIN',
  MISSING_VALUATION = 'MISSING_VALUATION',
  INCOMPLETE_FORM = 'INCOMPLETE_FORM',
  UNKNOWN = 'UNKNOWN_VALIDATION_ERROR'
}

/**
 * Submission error codes
 */
export enum SubmissionErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  SERVER_ERROR = 'SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  UNKNOWN = 'UNKNOWN_SUBMISSION_ERROR'
}

/**
 * Authentication error codes
 */
export enum AuthErrorCode {
  UNAUTHENTICATED = 'UNAUTHENTICATED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  UNKNOWN = 'UNKNOWN_AUTH_ERROR'
}
