
/**
 * Custom API Error class
 * Updated: 2025-04-26 - Simplified implementation
 * Updated: 2025-04-26 - Added statusCode, errorCode, category and isNetworkError properties
 */
class ApiError extends Error {
  originalError?: any;
  statusCode?: number;
  errorCode?: string;
  category?: 'network' | 'validation' | 'authentication' | 'server' | 'unknown';
  isNetworkError: boolean;

  constructor(params: { 
    message: string; 
    originalError?: any;
    statusCode?: number;
    errorCode?: string;
    category?: 'network' | 'validation' | 'authentication' | 'server' | 'unknown';
  }) {
    super(params.message);
    this.name = 'ApiError';
    this.originalError = params.originalError;
    this.statusCode = params.statusCode;
    this.errorCode = params.errorCode;
    this.category = params.category;
    
    // Calculate isNetworkError based on category or statusCode
    this.isNetworkError = 
      params.category === 'network' || 
      params.errorCode === 'NETWORK_ERROR' ||
      params.statusCode === 0 ||
      params.statusCode === 408 ||
      (params.originalError?.message && 
        (params.originalError.message.toLowerCase().includes('network') ||
         params.originalError.message.toLowerCase().includes('connection') ||
         params.originalError.message.toLowerCase().includes('timeout')));
  }
}

export { ApiError };
