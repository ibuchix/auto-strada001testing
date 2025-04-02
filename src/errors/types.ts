
/**
 * Updated 2028-05-15: Added additional error types and codes for better error handling
 */

export enum ErrorCategory {
  VALIDATION = 'validation',
  SUBMISSION = 'submission',
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  PERMISSION = 'permission',
  GENERAL = 'general',
  UNKNOWN = 'unknown'
}

export enum RecoveryType {
  FORM_RETRY = 'form_retry',
  FIELD_CORRECTION = 'field_correction',
  NAVIGATE = 'navigate',
  SIGN_IN = 'sign_in',
  REFRESH = 'refresh',
  CONTACT_SUPPORT = 'contact_support',
  CUSTOM = 'custom'
}

export interface RecoveryAction {
  type: RecoveryType;
  label: string;
  action: () => void;
  fieldId?: string; // For field-specific recovery
  route?: string; // For navigation-based recovery
}

// Added error codes for each error category
export enum ValidationErrorCode {
  REQUIRED_FIELD = 'required_field',
  INVALID_FORMAT = 'invalid_format',
  EXCEEDS_MAX = 'exceeds_max',
  BELOW_MIN = 'below_min',
  PATTERN_MISMATCH = 'pattern_mismatch',
  DUPLICATE_VALUE = 'duplicate_value',
  MISSING_VALUATION = 'missing_valuation',
  INCOMPLETE_FORM = 'incomplete_form'
}

export enum SubmissionErrorCode {
  SERVER_ERROR = 'server_error',
  CONFLICT = 'conflict',
  RATE_LIMITED = 'rate_limited',
  VALIDATION_FAILED = 'validation_failed',
  MISSING_FIELD = 'missing_field',
  UNAUTHORIZED = 'unauthorized',
  TRANSACTION_FAILED = 'transaction_failed'
}

export enum AuthErrorCode {
  UNAUTHENTICATED = 'unauthenticated',
  UNAUTHORIZED = 'unauthorized',
  TOKEN_EXPIRED = 'token_expired',
  INVALID_CREDENTIALS = 'invalid_credentials',
  ACCOUNT_LOCKED = 'account_locked'
}

export enum NetworkErrorCode {
  CONNECTION_LOST = 'connection_lost',
  TIMEOUT = 'timeout',
  SERVER_UNREACHABLE = 'server_unreachable',
  API_ERROR = 'api_error'
}
