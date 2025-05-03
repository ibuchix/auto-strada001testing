
/**
 * Error types and enums
 * Created: 2025-07-22
 */

export enum ErrorCategory {
  VALIDATION = 'validation',
  NETWORK = 'network',
  DATABASE = 'database',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  BUSINESS = 'business',
  NOT_FOUND = 'not_found',
  UNKNOWN = 'unknown'
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
  PAGE_NOT_FOUND = 'page_not_found'
}
