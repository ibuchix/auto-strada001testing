
/**
 * Custom error class for API errors
 * 
 * Changes made:
 * - 2026-05-10: Enhanced with error code, category and network status detection
 * - 2026-05-12: Fixed TypeScript type issues with Error.code property
 */
interface CustomErrorInterface extends Error {
  code?: string;
  originalError?: Error | any;
  statusCode?: number;
  errorCode?: string;
  isNetworkError?: boolean;
}

export class ApiError extends Error implements CustomErrorInterface {
  public originalError?: Error | any;
  public statusCode?: number;
  public errorCode?: string;
  public isNetworkError: boolean;
  public category: 'network' | 'validation' | 'authentication' | 'server' | 'unknown';

  constructor(params: {
    message: string;
    originalError?: Error | any;
    statusCode?: number;
    errorCode?: string;
    category?: 'network' | 'validation' | 'authentication' | 'server' | 'unknown';
  }) {
    super(params.message);
    
    this.name = 'ApiError';
    this.originalError = params.originalError;
    this.statusCode = params.statusCode;
    this.errorCode = params.errorCode;
    this.category = params.category || 'unknown';
    
    // Determine network error status
    this.isNetworkError = this.detectNetworkError();
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  private detectNetworkError(): boolean {
    // Check fetch/axios network errors
    if (this.originalError) {
      const isAxiosNetworkError = this.originalError.name === 'AxiosError' && 
        this.originalError.code === 'ERR_NETWORK';
      
      // Check for Node.js style system-level network errors
      const errorCode = (this.originalError as any).code;
      const isSystemNetworkError = errorCode === 'ECONNREFUSED' ||
          errorCode === 'ECONNRESET' ||
          errorCode === 'ETIMEDOUT' ||
          errorCode === 'ENETUNREACH';

      return isAxiosNetworkError || isSystemNetworkError || 
        this.statusCode === 0 || // No response received
        this.statusCode === 504; // Gateway timeout
    }
    return false;
  }
}
