
/**
 * Centralized error type definitions
 * Created: 2025-04-05
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
  UNKNOWN = 'unknown'
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
  UNEXPECTED_ERROR = 'unexpected_error'
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

export interface ErrorMetadata {
  correlationId?: string;
  timestamp?: number;
  source?: string;
  originalError?: any;
  details?: Record<string, any>;
  path?: string;
  [key: string]: any;
}

export interface ErrorRecovery {
  action: RecoveryAction;
  label: string;
  handler?: () => void;
  route?: string;
  data?: any;
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
