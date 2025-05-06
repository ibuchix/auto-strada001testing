
/**
 * Request validation utilities for create-car-listing
 * Created: 2025-05-06 - Moved from external dependency to local implementation
 */

import { logOperation } from "./logging.ts";

/**
 * Validates the car listing request
 * @param request Request data to validate
 * @returns Validation result with success flag
 */
export function validateListingRequest(request: any): { valid: boolean; error?: string } {
  try {
    // Required fields
    const requiredFields = {
      'userId': 'User ID',
      'vin': 'VIN',
      'mileage': 'Mileage',
      'transmission': 'Transmission',
      'valuationData': 'Valuation data'
    };
    
    // Check required fields
    for (const [field, label] of Object.entries(requiredFields)) {
      if (request[field] === undefined || request[field] === null) {
        return { valid: false, error: `${label} is required` };
      }
    }

    // Check data types
    if (typeof request.userId !== 'string') {
      return { valid: false, error: 'User ID must be a string' };
    }
    
    if (typeof request.vin !== 'string') {
      return { valid: false, error: 'VIN must be a string' };
    }
    
    // Basic VIN format validation
    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(request.vin)) {
      return { valid: false, error: 'VIN must be 17 characters and contain valid characters' };
    }
    
    // Type checks with coercion for numeric values
    const mileage = Number(request.mileage);
    if (isNaN(mileage) || mileage < 0) {
      return { valid: false, error: 'Valid mileage is required' };
    }
    
    // Basic transmission validation
    if (typeof request.transmission !== 'string') {
      return { valid: false, error: 'Transmission must be a string' };
    }
    
    // Basic valuation data validation
    if (!request.valuationData || typeof request.valuationData !== 'object') {
      return { valid: false, error: 'Valid valuation data is required' };
    }
    
    // Valuation data required fields
    const requiredValuationFields = ['make', 'model', 'year'];
    const missingFields = requiredValuationFields.filter(
      field => !request.valuationData[field]
    );
    
    if (missingFields.length > 0) {
      return { 
        valid: false, 
        error: `Missing required valuation data: ${missingFields.join(', ')}` 
      };
    }
    
    return { valid: true };
  } catch (error) {
    logOperation('validation_error', { 
      error: (error as Error).message 
    }, 'error');
    
    return { valid: false, error: 'Validation error occurred' };
  }
}
