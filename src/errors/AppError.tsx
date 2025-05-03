
/**
 * Application Error Class
 * Created: 2025-07-22
 * Centralized error handling class for the application
 */

import { ErrorCategory, ErrorCode } from './types';

export class AppError extends Error {
  public readonly category: ErrorCategory;
  public readonly code: ErrorCode;
  public readonly timestamp: Date;
  public readonly originalError?: Error;

  constructor(
    message: string, 
    code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    originalError?: Error
  ) {
    super(message);
    
    // Set name and maintain prototype chain
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
    
    // Custom properties
    this.code = code;
    this.category = category;
    this.timestamp = new Date();
    this.originalError = originalError;
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Factory method to create an error from an unknown source
   */
  static createFromUnknown(error: unknown): AppError {
    if (error instanceof AppError) {
      return error;
    }
    
    if (error instanceof Error) {
      return new AppError(
        error.message,
        ErrorCode.UNKNOWN_ERROR,
        ErrorCategory.UNKNOWN,
        error
      );
    }
    
    const errorMessage = typeof error === 'string' 
      ? error 
      : 'An unknown error occurred';
    
    return new AppError(errorMessage);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, code: ErrorCode = ErrorCode.VALIDATION_ERROR) {
    super(message, code, ErrorCategory.VALIDATION);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class NetworkError extends AppError {
  constructor(message: string, code: ErrorCode = ErrorCode.NETWORK_ERROR) {
    super(message, code, ErrorCategory.NETWORK);
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, code: ErrorCode = ErrorCode.DATABASE_ERROR) {
    super(message, code, ErrorCategory.DATABASE);
    this.name = 'DatabaseError';
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string, code: ErrorCode = ErrorCode.AUTH_ERROR) {
    super(message, code, ErrorCategory.AUTHENTICATION);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

export class BusinessLogicError extends AppError {
  constructor(message: string, code: ErrorCode = ErrorCode.BUSINESS_LOGIC_ERROR) {
    super(message, code, ErrorCategory.BUSINESS);
    this.name = 'BusinessLogicError';
    Object.setPrototypeOf(this, BusinessLogicError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, code: ErrorCode = ErrorCode.NOT_FOUND) {
    super(message, code, ErrorCategory.NOT_FOUND);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}
