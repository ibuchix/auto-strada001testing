
/**
 * Error Types
 * Created: 2025-06-22 - Added missing error codes
 * Updated: 2025-06-23 - Fixed RecoveryAction and ErrorRecovery types
 * Updated: 2025-07-01 - Fixed RecoveryAction export issue and enum references
 */

export enum ErrorCode {
  // Generic error codes
  UNKNOWN_ERROR = 'unknown_error',
  INTERNAL_ERROR = 'internal_error',
  NETWORK_ERROR = 'network_error',
  SERVER_ERROR = 'server_error',
  CLIENT_ERROR = 'client_error',
  TIMEOUT_ERROR = 'timeout_error',
  
  // Authentication errors
  AUTH_ERROR = 'auth_error',
  UNAUTHORIZED = 'unauthorized',
  SESSION_EXPIRED = 'session_expired',
  INVALID_CREDENTIALS = 'invalid_credentials',
  
  // Validation errors
  VALIDATION_ERROR = 'validation_error',
  SCHEMA_VALIDATION_ERROR = 'schema_validation_error',
  MISSING_REQUIRED_FIELD = 'missing_required_field',
  INVALID_FORMAT = 'invalid_format',
  REQUIRED_FIELD = 'required_field',
  
  // Submission errors
  SUBMISSION_ERROR = 'submission_error',
  INCOMPLETE_FORM = 'incomplete_form',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  SERVER_VALIDATION_FAILED = 'server_validation_failed',
  
  // Valuation errors
  VALUATION_ERROR = 'valuation_error',
  MISSING_VALUATION = 'missing_valuation',
  
  // File errors
  FILE_ERROR = 'file_error',
  FILE_UPLOAD_ERROR = 'file_upload_error',
  FILE_TOO_LARGE = 'file_too_large',
  INVALID_FILE_TYPE = 'invalid_file_type',
  
  // Data errors
  DATA_ERROR = 'data_error',
  NOT_FOUND = 'not_found',
  DUPLICATE_ENTRY = 'duplicate_entry',
  CONFLICT = 'conflict',
  
  // Transaction errors
  TRANSACTION_ERROR = 'transaction_error',
  PAYMENT_ERROR = 'payment_error',
  INSUFFICIENT_FUNDS = 'insufficient_funds',
}

export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

// Updated RecoveryType to include all necessary types
export enum RecoveryType {
  RETRY = 'retry',
  REDIRECT = 'redirect',
  REFRESH = 'refresh',
  CONTACT_SUPPORT = 'contact_support',
  FORM_RETRY = 'form_retry',
  MANUAL_ACTION = 'manual_action',
  FIELD_CORRECTION = 'field_correction',
  SIGN_IN = 'sign_in',
  NAVIGATE = 'navigate',
}

// Recovery action as enum - making it a concrete enum instead of just a type
export enum RecoveryAction {
  RETRY = 'retry',
  REDIRECT = 'redirect',
  REFRESH = 'refresh',
  CONTACT_SUPPORT = 'contact_support',
  FORM_RETRY = 'form_retry',
  MANUAL_ACTION = 'manual_action',
  FIELD_CORRECTION = 'field_correction',
  SIGN_IN = 'sign_in',
  NAVIGATE = 'navigate',
  AUTHENTICATE = 'authenticate'
}

// Enhanced ErrorRecovery interface with all required properties
export interface ErrorRecovery {
  type: RecoveryType;
  action: RecoveryAction;
  label: string;
  route?: string;
  handler?: () => void | Promise<void>;
}

export interface ErrorDetails {
  message: string;
  code: ErrorCode;
  description?: string;
  category?: ErrorCategory;
  recovery?: ErrorRecovery;
  severity?: ErrorSeverity;
  field?: string;
  metadata?: Record<string, any>;
}

export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATABASE = 'database',
  NETWORK = 'network',
  INTERNAL = 'internal',
  GENERAL = 'general',
  UNKNOWN = 'unknown',
  SERVER = 'server',
  BUSINESS = 'business'
}

export interface AppError extends ErrorDetails {
  id?: string;
  timestamp?: string;
  retryable?: boolean;
  serialize?: () => Record<string, any>;
  withDescription?: (description: string) => AppError;
  withRecovery?: (recovery: ErrorRecovery) => AppError;
}
