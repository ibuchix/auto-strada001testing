
/**
 * Valuation-specific error types
 * Created: 2025-04-19
 */

import { AppError } from '../classes';
import { ErrorCode, ErrorCategory, RecoveryType } from '../types';

export class ValuationError extends AppError {
  constructor(params: {
    message: string;
    code?: ErrorCode;
    description?: string;
    retry?: boolean;
    vin?: string;
    data?: any;
  }) {
    super({
      message: params.message,
      code: params.code || ErrorCode.VALIDATION_ERROR,
      category: ErrorCategory.VALIDATION,
      description: params.description,
      metadata: {
        vin: params.vin,
        data: params.data
      },
      recovery: params.retry ? {
        type: RecoveryType.FORM_RETRY,
        label: 'Try Again',
        action: RecoveryType.FORM_RETRY
      } : undefined
    });
  }
}

export class NoValuationDataError extends ValuationError {
  constructor(vin: string) {
    super({
      message: 'No valuation data found for this vehicle',
      description: 'We could not find pricing data for this VIN. Please verify the VIN is correct.',
      code: ErrorCode.RESOURCE_NOT_FOUND,
      vin,
      retry: true
    });
  }
}

export class InvalidValuationDataError extends ValuationError {
  constructor(vin: string, data: any) {
    super({
      message: 'Invalid valuation data received',
      description: 'The valuation data received was not in the expected format.',
      code: ErrorCode.INVALID_VALUE,
      vin,
      data,
      retry: true
    });
  }
}

export class ValuationTimeoutError extends ValuationError {
  constructor(vin: string) {
    super({
      message: 'Valuation request timed out',
      description: 'The valuation service is taking longer than expected. Please try again.',
      code: ErrorCode.REQUEST_TIMEOUT,
      vin,
      retry: true
    });
  }
}
