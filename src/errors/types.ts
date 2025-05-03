
/**
 * Error types and enums
 * Created: 2025-07-22
 * Updated: 2025-07-23 - Added missing ErrorSeverity, RecoveryAction, and SERVER to ErrorCategory
 */

export enum ErrorCategory {
  VALIDATION = 'validation',
  NETWORK = 'network',
  DATABASE = 'database',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  BUSINESS = 'business',
  NOT_FOUND = 'not_found',
  UNKNOWN = 'unknown',
  SERVER = 'server'  // Added missing SERVER category
}

export enum ErrorCode {
  // General errors
  UNKNOWN_ERROR = 'unknown_error',
  
  // Validation errors
  VALIDATION_ERROR = 'validation_error',
  REQUIRED_FIELD_MISSING = 'required_field_missing',
  INVALID_FORMAT = 'invalid_format',
  INVALID_VALUE = 'invalid_value',
  
  // Network errors
  NETWORK_ERROR = 'network_error',
  REQUEST_TIMEOUT = 'request_timeout',
  REQUEST_FAILED = 'request_failed',
  
  // Database errors
  DATABASE_ERROR = 'database_error',
  QUERY_FAILED = 'query_failed',
  RECORD_NOT_FOUND = 'record_not_found',
  DUPLICATE_RECORD = 'duplicate_record',
  
  // Authentication errors
  AUTH_ERROR = 'auth_error',
  INVALID_CREDENTIALS = 'invalid_credentials',
  SESSION_EXPIRED = 'session_expired',
  
  // Authorization errors
  UNAUTHORIZED = 'unauthorized',
  FORBIDDEN = 'forbidden',
  
  // Business logic errors
  BUSINESS_LOGIC_ERROR = 'business_logic_error',
  INVALID_STATE_TRANSITION = 'invalid_state_transition',
  SUBMISSION_ERROR = 'submission_error',
  
  // Not found errors
  NOT_FOUND = 'not_found',
  RESOURCE_NOT_FOUND = 'resource_not_found',
  PAGE_NOT_FOUND = 'page_not_found',
  
  // New server error
  SERVER_ERROR = 'server_error',
  
  // New authorization error
  AUTHORIZATION_ERROR = 'authorization_error'
}

// Add missing ErrorSeverity enum
export enum ErrorSeverity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

// Add missing RecoveryAction enum
export enum RecoveryAction {
  RETRY = 'retry',
  REFRESH = 'refresh',
  NAVIGATE = 'navigate',
  SIGN_IN = 'sign_in',
  CONTACT_SUPPORT = 'contact_support'
}

export enum RecoveryType {
  AUTO = 'auto',
  MANUAL = 'manual',
  NONE = 'none'
}

// Add error recovery interface
export interface ErrorRecovery {
  action: RecoveryAction;
  label: string;
  url?: string;
  handler?: () => void;
}

// Add app error options interface
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
