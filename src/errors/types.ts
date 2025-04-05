
/**
 * Centralized error type definitions
 * Created: 2025-04-05
 * Updated: 2025-04-05 - Added backward compatibility types and fixed enum references
 */

export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  VALIDATION = 'validation',
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  SERVER = 'server',
  CLIENT = 'client',
  BUSINESS = 'business',
  UNKNOWN = 'unknown',
  GENERAL = 'general', // Added for backward compatibility
  PERMISSION = 'permission' // Added for backward compatibility
}

export enum ErrorCode {
  // Validation errors
  REQUIRED_FIELD = 'required_field',
  INVALID_FORMAT = 'invalid_format',
  INVALID_VALUE = 'invalid_value',
  INVALID_VIN = 'invalid_vin',
  
  // Network errors
  NETWORK_UNAVAILABLE = 'network_unavailable',
  REQUEST_TIMEOUT = 'request_timeout',
  API_UNREACHABLE = 'api_unreachable',
  
  // Authentication errors
  UNAUTHENTICATED = 'unauthenticated',
  SESSION_EXPIRED = 'session_expired',
  INVALID_CREDENTIALS = 'invalid_credentials',
  
  // Authorization errors
  UNAUTHORIZED = 'unauthorized',
  INSUFFICIENT_PERMISSIONS = 'insufficient_permissions',
  
  // Server errors
  SERVER_ERROR = 'server_error',
  DATABASE_ERROR = 'database_error',
  SERVICE_UNAVAILABLE = 'service_unavailable',
  
  // Business logic errors
  DUPLICATE_ENTRY = 'duplicate_entry',
  INVALID_OPERATION = 'invalid_operation',
  RESOURCE_NOT_FOUND = 'resource_not_found',
  VALUATION_ERROR = 'valuation_error',
  SUBMISSION_ERROR = 'submission_error',
  
  // Unknown/general errors
  UNKNOWN_ERROR = 'unknown_error',
  UNEXPECTED_ERROR = 'unexpected_error',
  
  // Extended validation codes for backward compatibility
  VALIDATION_ERROR = 'validation_error',
  SCHEMA_VALIDATION_ERROR = 'schema_validation_error',
  INCOMPLETE_FORM = 'incomplete_form',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  SERVER_VALIDATION_FAILED = 'server_validation_failed',
  MISSING_VALUATION = 'missing_valuation',
  
  // Extended submission codes for backward compatibility
  INVALID_INPUT = 'invalid_input',
  DUPLICATE_SUBMISSION = 'duplicate_submission',
  DATABASE_CONSTRAINT = 'database_constraint',
  SUBMISSION_FAILED = 'submission_failed'
}

// For backward compatibility with existing code
export enum ValidationErrorCode {
  VALIDATION_ERROR = ErrorCode.VALIDATION_ERROR,
  REQUIRED_FIELD = ErrorCode.REQUIRED_FIELD,
  INVALID_FORMAT = ErrorCode.INVALID_FORMAT,
  INVALID_VALUE = ErrorCode.INVALID_VALUE,
  INVALID_VIN = ErrorCode.INVALID_VIN,
  SCHEMA_VALIDATION_ERROR = ErrorCode.SCHEMA_VALIDATION_ERROR,
  INCOMPLETE_FORM = ErrorCode.INCOMPLETE_FORM,
  RATE_LIMIT_EXCEEDED = ErrorCode.RATE_LIMIT_EXCEEDED,
  SERVER_VALIDATION_FAILED = ErrorCode.SERVER_VALIDATION_FAILED,
  MISSING_VALUATION = ErrorCode.MISSING_VALUATION
}

export enum SubmissionErrorCode {
  SUBMISSION_ERROR = ErrorCode.SUBMISSION_ERROR,
  INVALID_INPUT = ErrorCode.INVALID_INPUT, 
  SCHEMA_VALIDATION_ERROR = ErrorCode.SCHEMA_VALIDATION_ERROR,
  DUPLICATE_SUBMISSION = ErrorCode.DUPLICATE_SUBMISSION,
  DATABASE_CONSTRAINT = ErrorCode.DATABASE_CONSTRAINT,
  SUBMISSION_FAILED = ErrorCode.SUBMISSION_FAILED
}

export enum RecoveryAction {
  RETRY = 'retry',
  REFRESH = 'refresh',
  NAVIGATE = 'navigate',
  AUTHENTICATE = 'authenticate',
  CONTACT_SUPPORT = 'contact_support',
  DISMISS = 'dismiss',
  MANUAL_RESOLUTION = 'manual_resolution'
}

// For backward compatibility with existing code
export enum RecoveryType {
  FIELD_CORRECTION = 'field_correction',
  FORM_RETRY = 'form_retry',
  SIGN_IN = 'sign_in',
  NAVIGATE = 'navigate',
  REFRESH = 'refresh',
  CONTACT_SUPPORT = 'contact_support'
}

export interface ErrorMetadata {
  correlationId?: string;
  timestamp?: number;
  source?: string;
  originalError?: any;
  details?: Record<string, any>;
  path?: string;
  field?: string; // Added for field validation errors
  [key: string]: any;
}

export interface ErrorRecovery {
  action: RecoveryAction;
  label: string;
  handler?: () => void;
  route?: string;
  data?: any;
  // For backward compatibility
  type?: RecoveryType;
}

export interface SerializedAppError {
  message: string;
  code: ErrorCode;
  category: ErrorCategory;
  severity: ErrorSeverity;
  metadata?: ErrorMetadata;
  recovery?: ErrorRecovery;
  timestamp: number;
  id: string;
}

// Additional compatibility types
export type ErrorHandler = (error: unknown) => void;
export type ErrorCallback = (error: any) => void;
