
/**
 * Changes made:
 * - Created custom error classes for form validation and submission
 * - Added proper typing for error properties
 * - Implemented descriptive error handling with action support
 */

export class ValidationError extends Error {
  description: string;
  action?: { label: string; onClick: () => void };
  
  constructor(
    message: string, 
    description: string = '',
    action?: { label: string; onClick: () => void }
  ) {
    super(message);
    this.name = "ValidationError";
    this.description = description;
    this.action = action;
  }
}

export class SubmissionError extends Error {
  description: string;
  retryable: boolean;
  
  constructor(
    message: string,
    description: string = '',
    retryable: boolean = false
  ) {
    super(message);
    this.name = "SubmissionError";
    this.description = description;
    this.retryable = retryable;
  }
}
