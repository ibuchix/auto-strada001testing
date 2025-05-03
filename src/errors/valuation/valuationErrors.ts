
/**
 * Valuation specific error types
 * Updated: 2025-07-03 - Fixed RecoveryAction usage
 */

import { AppError } from '../classes';
import { 
  ErrorCode, 
  ErrorCategory, 
  ErrorSeverity, 
  RecoveryType,
  RecoveryAction
} from '../types';

export class ValuationError extends AppError {
  constructor(message: string, code: ErrorCode = ErrorCode.VALUATION_ERROR) {
    super({
      message,
      code,
      category: ErrorCategory.BUSINESS,
      severity: ErrorSeverity.ERROR
    });
    
    // Default recovery action for valuation errors
    this.recovery = {
      type: RecoveryType.RETRY,
      label: 'Try Again',
      action: RecoveryAction.RETRY
    };
  }
}

export class ValuationFormRetryError extends ValuationError {
  constructor(message: string = 'There was an error with your valuation request.') {
    super(message);
    
    this.recovery = {
      type: RecoveryType.FORM_RETRY,
      label: 'Try Again',
      action: RecoveryAction.FORM_RETRY
    };
  }
}

export class ValuationNetworkError extends ValuationError {
  constructor(message: string = 'Network error occurred while getting your valuation.') {
    super(message, ErrorCode.NETWORK_ERROR);
    this.category = ErrorCategory.NETWORK;
  }
}

export class ValuationTimeoutError extends ValuationError {
  constructor(message: string = 'The valuation request timed out.') {
    super(message, ErrorCode.REQUEST_TIMEOUT);
    
    this.recovery = {
      type: RecoveryType.RETRY,
      label: 'Try Again',
      action: RecoveryAction.RETRY
    };
  }
}

export class ValuationInvalidInputError extends ValuationError {
  constructor(message: string = 'Invalid input provided for valuation.') {
    super(message, ErrorCode.INVALID_VALUE);
    this.category = ErrorCategory.VALIDATION;
  }
}

export class ValuationUnavailableError extends ValuationError {
  constructor(message: string = 'Valuation service is currently unavailable.') {
    super(message, ErrorCode.SERVER_ERROR);
    
    this.severity = ErrorSeverity.WARNING;
    this.recovery = {
      type: RecoveryType.CONTACT_SUPPORT,
      label: 'Contact Support',
      action: RecoveryAction.CONTACT_SUPPORT
    };
  }
}
