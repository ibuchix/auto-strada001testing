
/**
 * Custom API Error class
 * Updated: 2025-04-26 - Simplified implementation
 */
class ApiError extends Error {
  originalError?: any;

  constructor(params: { 
    message: string; 
    originalError?: any 
  }) {
    super(params.message);
    this.name = 'ApiError';
    this.originalError = params.originalError;
  }
}

export { ApiError };
