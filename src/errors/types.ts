
/**
 * Error types definitions
 * Created: 2025-07-02
 * Updated: 2025-07-10 - Added missing enum values and AppErrorOptions interface
 * Updated: 2025-07-12 - Added more error codes needed by the application
 */

export enum ErrorCode {
  // General errors
  UNKNOWN_ERROR = 'unknown_error',
  VALIDATION_ERROR = 'validation_error',
  NETWORK_ERROR = 'network_error',
  
  // Auth-related errors
  AUTH_ERROR = 'auth_error',
  UNAUTHENTICATED = 'unauthenticated',
  AUTHORIZATION_ERROR = 'authorization_error',
  
  // Resource errors
  RESOURCE_NOT_FOUND = 'resource_not_found',
  RESOURCE_CONFLICT = 'resource_conflict',
  
  // Operation errors
  OPERATION_FAILED = 'operation_failed',
  INVALID_OPERATION = 'invalid_operation',
  SUBMISSION_ERROR = 'submission_error',
  INCOMPLETE_FORM = 'incomplete_form',
  FILE_UPLOAD_ERROR = 'file_upload_error',
  
  // Server errors
  SERVER_ERROR = 'server_error',

  // Business logic errors
  BUSINESS_ERROR = 'business_error',

  // Unexpected errors
  UNEXPECTED_ERROR = 'unexpected_error'
}

export enum ErrorCategory {
  // Error categories
  VALIDATION = 'validation',
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  SERVER = 'server',
  CLIENT = 'client',
  BUSINESS = 'business',
  UNKNOWN = 'unknown'
}

export enum ErrorSeverity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

// For backward compatibility
export enum RecoveryAction {
  NAVIGATE = 'navigate',
  RETRY = 'retry',
  REFRESH = 'refresh',
  SIGN_IN = 'sign_in',
  DISMISS = 'dismiss',
  CONTACT_SUPPORT = 'contact_support'
}

export enum RecoveryType {
  FIELD_CORRECTION = 'field_correction',
  FORM_RETRY = 'form_retry',
  SIGN_IN = 'sign_in',
  NAVIGATE = 'navigate',
  REFRESH = 'refresh',
  CONTACT_SUPPORT = 'contact_support'
}

export interface ErrorRecovery {
  type: RecoveryType;
  label: string;
  action?: RecoveryAction;
  handler?: () => void;
  route?: string;
}

export interface ErrorDetails {
  message: string;
  code: ErrorCode;
  description?: string;
}

export interface AppErrorOptions {
  id?: string;
  message: string;
  code?: ErrorCode;
  category?: ErrorCategory;
  severity?: ErrorSeverity;
  description?: string;
  recovery?: ErrorRecovery;
  metadata?: Record<string, any>;
  retryable?: boolean;
}
