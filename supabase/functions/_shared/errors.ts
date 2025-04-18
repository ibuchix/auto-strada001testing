
// Error classes for edge functions
// Added: 2025-04-18 - Extracted error classes to a dedicated file

export class ValidationError extends Error {
  code: string;
  
  constructor(message: string, code = 'VALIDATION_ERROR') {
    super(message);
    this.name = 'ValidationError';
    this.code = code;
  }
}
