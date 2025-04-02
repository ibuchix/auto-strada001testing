/**
 * Custom error class for API errors
 * 
 * Changes made:
 * - 2026-05-10: Enhanced with error code, category and network status detection
 */
export class ApiError extends Error {
  public originalError?: Error;
  public statusCode?: number;
  public errorCode?: string;
  public isNetworkError: boolean;
  public category: 'network' | 'auth' | 'validation' | 'server' | 'unknown';
  public retryable: boolean;
  
  constructor(
    message: string, 
    options: {
      originalError?: Error | any, 
      statusCode?: number,
      errorCode?: string,
      isNetworkError?: boolean,
      category?: 'network' | 'auth' | 'validation' | 'server' | 'unknown',
      retryable?: boolean
    } = {}
  ) {
    super(message);
    
    const {
      originalError,
      statusCode,
      errorCode,
      isNetworkError = false,
      category,
      retryable
    } = options;
    
    this.name = "ApiError";
    this.originalError = originalError;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isNetworkError = isNetworkError || this.detectNetworkError();
    
    // Determine category based on status code or provided category
    this.category = category || this.determineCategory();
    
    // Determine if the error is retryable
    this.retryable = retryable !== undefined ? retryable : this.isRetryable();
    
    // Maintain proper stack trace for debugging
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
  
  private detectNetworkError(): boolean {
    // Check if this is a network-related error based on message or original error
    const errorMsg = this.message.toLowerCase();
    const isNetworkIssue = 
      errorMsg.includes('network') || 
      errorMsg.includes('connection') ||
      errorMsg.includes('internet') ||
      errorMsg.includes('offline') ||
      errorMsg.includes('timeout') ||
      errorMsg.includes('timed out');
      
    // Also check original error if available
    if (this.originalError) {
      const origMsg = this.originalError.message?.toLowerCase() || '';
      if (origMsg.includes('network') ||
          origMsg.includes('connection') ||
          origMsg.includes('internet') ||
          origMsg.includes('offline') ||
          origMsg.includes('timeout') ||
          origMsg.includes('timed out')) {
        return true;
      }
      
      // Check for common network error codes
      if (this.originalError.code === 'ECONNREFUSED' ||
          this.originalError.code === 'ECONNRESET' ||
          this.originalError.code === 'ETIMEDOUT' ||
          this.originalError.code === 'ENETUNREACH') {
        return true;
      }
    }
    
    return isNetworkIssue;
  }
  
  private determineCategory(): 'network' | 'auth' | 'validation' | 'server' | 'unknown' {
    if (this.isNetworkError) {
      return 'network';
    }
    
    // Determine based on status code
    if (this.statusCode) {
      if (this.statusCode === 401 || this.statusCode === 403) {
        return 'auth';
      }
      
      if (this.statusCode === 400 || this.statusCode === 422) {
        return 'validation';
      }
      
      if (this.statusCode >= 500) {
        return 'server';
      }
    }
    
    // Check message for auth-related terms
    const errorMsg = this.message.toLowerCase();
    if (errorMsg.includes('auth') || 
        errorMsg.includes('login') || 
        errorMsg.includes('signin') || 
        errorMsg.includes('unauthorized') ||
        errorMsg.includes('unauthenticated') ||
        errorMsg.includes('permission') ||
        errorMsg.includes('forbidden')) {
      return 'auth';
    }
    
    // Check message for validation-related terms
    if (errorMsg.includes('valid') || 
        errorMsg.includes('input') || 
        errorMsg.includes('required') ||
        errorMsg.includes('missing')) {
      return 'validation';
    }
    
    return 'unknown';
  }
  
  private isRetryable(): boolean {
    // Network errors are typically retryable
    if (this.isNetworkError) {
      return true;
    }
    
    // Server errors (500+) are typically retryable
    if (this.statusCode && this.statusCode >= 500) {
      return true;
    }
    
    // Rate limiting (429) is retryable
    if (this.statusCode === 429) {
      return true;
    }
    
    // Gateway timeout (408) is retryable
    if (this.statusCode === 408) {
      return true;
    }
    
    // Other client errors (400-499) are typically not retryable
    if (this.statusCode && this.statusCode >= 400 && this.statusCode < 500) {
      return false;
    }
    
    // Default to non-retryable for safety
    return false;
  }
}
