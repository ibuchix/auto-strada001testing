
/**
 * Custom Error Classes
 * Created: 2025-05-03
 * 
 * Custom error classes for form validation and submission
 */

import { ErrorCode, ErrorDetails } from "@/errors/types";

export class ValidationError extends Error {
  code: ErrorCode;
  description: string;
  
  constructor({ code, message, description = '' }: ErrorDetails) {
    super(message);
    this.name = 'ValidationError';
    this.code = code;
    this.description = description;
  }
}
