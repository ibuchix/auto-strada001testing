
/**
 * Centralized error classes
 * Created: 2025-04-05
 */

import { 
  ErrorCategory, 
  ErrorCode, 
  ErrorSeverity, 
  ErrorMetadata, 
  ErrorRecovery,
  SerializedAppError
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
  
  constructor(params: {
    message: string;
    code: ErrorCode;
    category?: ErrorCategory;
    severity?: ErrorSeverity;
    metadata?: ErrorMetadata;
    recovery?: ErrorRecovery;
    id?: string;
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
}

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
      recovery: params.recovery
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
  }) {
    super({
      message: params.message,
      code: params.code || ErrorCode.NETWORK_UNAVAILABLE,
      category: ErrorCategory.NETWORK,
      severity: params.severity || ErrorSeverity.ERROR,
      metadata: params.metadata,
      recovery: params.recovery
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
  }) {
    super({
      message: params.message,
      code: params.code || ErrorCode.UNAUTHENTICATED,
      category: ErrorCategory.AUTHENTICATION,
      severity: params.severity || ErrorSeverity.ERROR,
      metadata: params.metadata,
      recovery: params.recovery
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
  }) {
    super({
      message: params.message,
      code: params.code || ErrorCode.UNAUTHORIZED,
      category: ErrorCategory.AUTHORIZATION,
      severity: params.severity || ErrorSeverity.ERROR,
      metadata: params.metadata,
      recovery: params.recovery
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
  }) {
    super({
      message: params.message,
      code: params.code || ErrorCode.SERVER_ERROR,
      category: ErrorCategory.SERVER,
      severity: params.severity || ErrorSeverity.ERROR,
      metadata: params.metadata,
      recovery: params.recovery
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
  }) {
    super({
      message: params.message,
      code: params.code || ErrorCode.INVALID_OPERATION,
      category: ErrorCategory.BUSINESS,
      severity: params.severity || ErrorSeverity.ERROR,
      metadata: params.metadata,
      recovery: params.recovery
    });
  }
}
