
/**
 * Error type definitions
 * Created: 2025-04-12
 * Updated: 2025-07-03 - Added missing error codes
 */

import { ReactNode } from "react";

export enum ErrorCode {
  // General errors
  UNKNOWN_ERROR = "unknown_error",
  VALIDATION_ERROR = "validation_error",
  NETWORK_ERROR = "network_error",
  SERVER_ERROR = "server_error",
  TIMEOUT_ERROR = "timeout_error",
  NOT_FOUND = "not_found",
  
  // Auth errors
  AUTH_ERROR = "auth_error",
  INVALID_CREDENTIALS = "invalid_credentials",
  EXPIRED_SESSION = "expired_session",
  UNAUTHORIZED = "unauthorized",
  FORBIDDEN = "forbidden",
  
  // Business logic errors
  SUBMISSION_ERROR = "submission_error",
  DATA_ERROR = "data_error",
  PROCESSING_ERROR = "processing_error",
  FILE_UPLOAD_ERROR = "file_upload_error",
  INCOMPLETE_FORM = "incomplete_form",

  // Valuation specific errors
  VALUATION_ERROR = "valuation_error",
  INVALID_VALUE = "invalid_value",
  REQUEST_TIMEOUT = "request_timeout",
  SCHEMA_VALIDATION_ERROR = "schema_validation_error",
  
  // API errors
  API_ERROR = "api_error",
  RATE_LIMITED = "rate_limited",
  
  // Form errors
  FORM_ERROR = "form_error"
}

export enum ErrorCategory {
  VALIDATION = "validation",
  NETWORK = "network",
  AUTH = "auth",
  BUSINESS = "business",
  TECHNICAL = "technical",
  GENERAL = "general"
}

export enum ErrorSeverity {
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
  CRITICAL = "critical"
}

export enum RecoveryType {
  RETRY = "retry",
  REDIRECT = "redirect",
  FORM_RETRY = "form_retry",
  CONTACT_SUPPORT = "contact_support",
  CUSTOM = "custom"
}

export enum RecoveryAction {
  RETRY = "retry",
  REDIRECT = "redirect",
  FORM_RETRY = "form_retry",
  CONTACT_SUPPORT = "contact_support",
  CUSTOM = "custom"
}

export interface ErrorRecovery {
  type: RecoveryType;
  label: string;
  action: RecoveryAction;
  url?: string;
  handler?: () => void;
}

export interface ErrorOptions {
  focus?: boolean;
  severity?: ErrorSeverity;
  metadata?: Record<string, any>;
  code?: ErrorCode;
}

export interface AppErrorParams {
  message: string;
  code: ErrorCode;
  category: ErrorCategory;
  severity: ErrorSeverity;
  description?: string;
  recovery?: ErrorRecovery;
  metadata?: Record<string, any>;
}

// Initial interface definition for AppError
export interface IAppError extends Error {
  id: string;
  code: ErrorCode;
  category: ErrorCategory;
  severity: ErrorSeverity;
  description?: string;
  recovery?: ErrorRecovery;
  metadata: Record<string, any>;
  timestamp: number;
  
  serialize(): AppErrorSerialized;
  withDescription(description: string): this;
  withRecovery(recovery: ErrorRecovery): this;
  withMetadata(metadata: Record<string, any>): this;
}

export interface AppErrorSerialized {
  id: string;
  message: string;
  code: ErrorCode;
  category: ErrorCategory;
  severity: ErrorSeverity;
  description?: string;
  recovery?: ErrorRecovery;
  metadata: Record<string, any>;
  timestamp: number;
  stack?: string;
}
