
/**
 * Error types for VIN validation
 * Created: 2025-04-18
 */

export class ValidationError extends Error {
  code: string;
  
  constructor(message: string, code = 'VALIDATION_ERROR') {
    super(message);
    this.name = 'ValidationError';
    this.code = code;
  }
}
