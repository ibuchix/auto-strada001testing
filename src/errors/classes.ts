
/**
 * Centralized error classes
 * Created: 2025-04-05
 * Updated: 2025-04-05 - Fixed TypeScript type errors and export compatibility
 * Updated: 2025-04-06 - Fixed redeclaration errors and property mutability
 */

import { 
  ErrorCategory, 
  ErrorCode, 
  ErrorSeverity, 
  ErrorMetadata, 
  ErrorRecovery,
  SerializedAppError,
  RecoveryAction
} from './types';

/**
 * Base application error class
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly metadata: ErrorMetadata;
  public readonly recovery?: ErrorRecovery;
  public readonly timestamp: number;
  public readonly id: string;
  public readonly description?: string;
  public readonly retryable?: boolean;
  
  constructor(params: {
    message: string;
    code: ErrorCode;
    category?: ErrorCategory;
    severity?: ErrorSeverity;
    metadata?: ErrorMetadata;
    recovery?: ErrorRecovery;
    id?: string;
    description?: string;
    retryable?: boolean;
  }) {
    super(params.message);
    
    this.name = this.constructor.name;
    this.code = params.code;
    this.category = params.category || ErrorCategory.UNKNOWN;
    this.severity = params.severity || ErrorSeverity.ERROR;
    this.metadata = params.metadata || {};
    this.recovery = params.recovery;
    this.timestamp = Date.now();
    this.id = params.id || crypto.randomUUID();
    this.description = params.description;
    this.retryable = params.retryable;
    
    // Ensure instanceof checks work correctly
    Object.setPrototypeOf(this, new.target.prototype);
  }
  
  /**
   * Serialize error for logging or transmission
   */
  public serialize(): SerializedAppError {
    return {
      message: this.message,
      code: this.code,
      category: this.category,
      severity: this.severity,
      metadata: this.metadata,
      recovery: this.recovery,
      timestamp: this.timestamp,
      id: this.id
    };
  }
  
  /**
   * Create error from serialized form
   */
  public static deserialize(serialized: SerializedAppError): AppError {
    return new AppError({
      message: serialized.message,
      code: serialized.code,
      category: serialized.category,
      severity: serialized.severity,
      metadata: serialized.metadata,
      recovery: serialized.recovery,
      id: serialized.id
    });
  }
  
  /**
   * Update the error's properties
   */
  public withRecovery(recovery: ErrorRecovery): AppError {
    return new AppError({
      message: this.message,
      code: this.code,
      category: this.category,
      severity: this.severity,
      metadata: this.metadata,
      recovery,
      description: this.description,
      retryable: this.retryable,
      id: this.id
    });
  }
  
  public withDescription(description: string): AppError {
    return new AppError({
      message: this.message,
      code: this.code,
      category: this.category,
      severity: this.severity,
      metadata: this.metadata,
      recovery: this.recovery,
      description,
      retryable: this.retryable,
      id: this.id
    });
  }
  
  public withRetryable(retryable: boolean): AppError {
    return new AppError({
      message: this.message,
      code: this.code,
      category: this.category,
      severity: this.severity,
      metadata: this.metadata,
      recovery: this.recovery,
      description: this.description,
      retryable,
      id: this.id
    });
  }
}

// Export BaseApplicationError as an alias to AppError for backward compatibility
export const BaseApplicationError = AppError;
// Also export it as a type alias
export type BaseApplicationError = AppError;

/**
 * Validation error class
 */
export class ValidationError extends AppError {
  constructor(params: {
    message: string;
    code?: ErrorCode;
    field?: string;
    severity?: ErrorSeverity;
    metadata?: ErrorMetadata;
    recovery?: ErrorRecovery;
    description?: string;
  }) {
    super({
      message: params.message,
      code: params.code || ErrorCode.INVALID_VALUE,
      category: ErrorCategory.VALIDATION,
      severity: params.severity || ErrorSeverity.WARNING,
      metadata: {
        ...params.metadata,
        field: params.field
      },
      recovery: params.recovery,
      description: params.description
    });
  }
  
  get field(): string | undefined {
    return this.metadata.field;
  }
}

/**
 * Network error class
 */
export class NetworkError extends AppError {
  constructor(params: {
    message: string;
    code?: ErrorCode;
    severity?: ErrorSeverity;
    metadata?: ErrorMetadata;
    recovery?: ErrorRecovery;
    description?: string;
    timeout?: number;
  }) {
    super({
      message: params.message,
      code: params.code || ErrorCode.NETWORK_UNAVAILABLE,
      category: ErrorCategory.NETWORK,
      severity: params.severity || ErrorSeverity.ERROR,
      metadata: { 
        ...params.metadata,
        timeout: params.timeout 
      },
      recovery: params.recovery,
      description: params.description
    });
  }
}

/**
 * Authentication error class
 */
export class AuthenticationError extends AppError {
  constructor(params: {
    message: string;
    code?: ErrorCode;
    severity?: ErrorSeverity;
    metadata?: ErrorMetadata;
    recovery?: ErrorRecovery;
    description?: string;
  }) {
    super({
      message: params.message,
      code: params.code || ErrorCode.UNAUTHENTICATED,
      category: ErrorCategory.AUTHENTICATION,
      severity: params.severity || ErrorSeverity.ERROR,
      metadata: params.metadata,
      recovery: params.recovery,
      description: params.description
    });
  }
}

/**
 * Authorization error class
 */
export class AuthorizationError extends AppError {
  constructor(params: {
    message: string;
    code?: ErrorCode;
    severity?: ErrorSeverity;
    metadata?: ErrorMetadata;
    recovery?: ErrorRecovery;
    description?: string;
  }) {
    super({
      message: params.message,
      code: params.code || ErrorCode.UNAUTHORIZED,
      category: ErrorCategory.AUTHORIZATION,
      severity: params.severity || ErrorSeverity.ERROR,
      metadata: params.metadata,
      recovery: params.recovery,
      description: params.description
    });
  }
}

/**
 * Server error class
 */
export class ServerError extends AppError {
  constructor(params: {
    message: string;
    code?: ErrorCode;
    severity?: ErrorSeverity;
    metadata?: ErrorMetadata;
    recovery?: ErrorRecovery;
    description?: string;
  }) {
    super({
      message: params.message,
      code: params.code || ErrorCode.SERVER_ERROR,
      category: ErrorCategory.SERVER,
      severity: params.severity || ErrorSeverity.ERROR,
      metadata: params.metadata,
      recovery: params.recovery,
      description: params.description
    });
  }
}

/**
 * Business logic error class
 */
export class BusinessError extends AppError {
  constructor(params: {
    message: string;
    code?: ErrorCode;
    severity?: ErrorSeverity;
    metadata?: ErrorMetadata;
    recovery?: ErrorRecovery;
    description?: string;
  }) {
    super({
      message: params.message,
      code: params.code || ErrorCode.INVALID_OPERATION,
      category: ErrorCategory.BUSINESS,
      severity: params.severity || ErrorSeverity.ERROR,
      metadata: params.metadata,
      recovery: params.recovery,
      description: params.description
    });
  }
}

/**
 * Submission error for form submissions
 */
export class SubmissionError extends BusinessError {
  constructor(params: {
    message: string;
    code?: ErrorCode;
    severity?: ErrorSeverity;
    metadata?: ErrorMetadata;
    recovery?: ErrorRecovery;
    description?: string;
    retryable?: boolean;
  }) {
    super({
      message: params.message,
      code: params.code || ErrorCode.SUBMISSION_ERROR,
      severity: params.severity || ErrorSeverity.ERROR,
      metadata: params.metadata,
      recovery: params.recovery,
      description: params.description
    });
    
    // Use withRetryable to create a new instance with retryable set
    if (params.retryable !== undefined) {
      return this.withRetryable(params.retryable) as SubmissionError;
    }
  }
}

// Re-export all error types for backward compatibility - but do it as a namespaced object
export const ApplicationErrors = {
  AppError,
  ValidationError,
  NetworkError,
  AuthenticationError, 
  AuthorizationError, 
  ServerError, 
  BusinessError, 
  SubmissionError
};

// Export AppError with alias ApplicationError for backward compatibility
export { AppError as ApplicationError };
