/**
 * Error Types
 * Created: 2025-05-03
 * Updated: 2025-06-15 - Added ErrorCategory, RecoveryAction and RecoveryType enums
 * Updated: 2025-06-16 - Fixed missing types and added ErrorRecovery interface
 * Updated: 2025-06-18 - Added ErrorCode enum
 * 
 * TypeScript types for error handling
 */

export enum ErrorCode {
  SCHEMA_VALIDATION_ERROR = 'SCHEMA_VALIDATION_ERROR',
  INCOMPLETE_FORM = 'INCOMPLETE_FORM',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SERVER_VALIDATION_FAILED = 'SERVER_VALIDATION_FAILED',
  SUBMISSION_ERROR = 'SUBMISSION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  NETWORK_UNAVAILABLE = 'NETWORK_UNAVAILABLE',
  REQUEST_TIMEOUT = 'REQUEST_TIMEOUT',
  INVALID_VALUE = 'INVALID_VALUE',
  INVALID_OPERATION = 'INVALID_OPERATION',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  UNEXPECTED_ERROR = 'UNEXPECTED_ERROR',
  UNAUTHENTICATED = 'UNAUTHENTICATED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  SERVER_ERROR = 'SERVER_ERROR'
}

export enum ErrorCategory {
  VALIDATION = 'validation',
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  BUSINESS = 'business',
  SERVER = 'server',
  UNKNOWN = 'unknown',
  CLIENT = 'client'
}

export enum RecoveryAction {
  RETRY = 'retry',
  NAVIGATE = 'navigate',
  REFRESH = 'refresh',
  AUTHENTICATE = 'authenticate',
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

export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface ErrorDetails {
  code: ErrorCode;
  message: string;
  description?: string;
}

export interface ErrorRecovery {
  type?: RecoveryType;
  action?: RecoveryAction;
  label: string;
  handler?: () => void;
  route?: string;
}

export interface RecoveryInfo {
  type: RecoveryType;
  label: string;
  handler?: () => void;
  route?: string;
  action?: RecoveryAction;
}
