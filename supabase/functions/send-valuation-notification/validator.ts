
/**
 * Request validation for send-valuation-notification
 * Created: 2025-04-19
 */

import { ValuationRequest } from './types.ts';

export function validateRequest(data: unknown): { success: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { success: false, error: 'Invalid request data' };
  }

  const request = data as Partial<ValuationRequest>;

  if (!request.userEmail) {
    return { success: false, error: 'Missing user email' };
  }

  if (!request.vehicleDetails) {
    return { success: false, error: 'Missing vehicle details' };
  }

  const { make, model } = request.vehicleDetails;
  if (!make || !model) {
    return { success: false, error: 'Vehicle details must include make and model' };
  }

  return { success: true };
}
