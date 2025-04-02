
/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  public originalError?: Error;
  public statusCode?: number;
  
  constructor(message: string, originalError?: Error | any, statusCode?: number) {
    super(message);
    this.name = "ApiError";
    this.originalError = originalError;
    this.statusCode = statusCode;
    
    // Maintain proper stack trace for debugging
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
}
