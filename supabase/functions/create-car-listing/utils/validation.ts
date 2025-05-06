
/**
 * Validation utilities for create-car-listing
 * Created: 2025-05-06 - Moved from external dependency to local implementation
 */

/**
 * Validate listing request data
 * 
 * @param requestData The request data to validate
 * @returns Object with validation result
 */
export function validateListingRequest(requestData: any): { valid: boolean; error?: string } {
  // Check for required fields
  const requiredFields = ['userId', 'vin', 'mileage', 'valuationData'];
  const missingFields = requiredFields.filter(field => !requestData[field]);
  
  if (missingFields.length > 0) {
    return {
      valid: false,
      error: `Missing required fields: ${missingFields.join(', ')}`
    };
  }
  
  // Check valuationData has required fields
  const requiredValuationFields = ['make', 'model', 'year'];
  const missingValuationFields = requiredValuationFields.filter(
    field => !requestData.valuationData[field]
  );
  
  if (missingValuationFields.length > 0) {
    return {
      valid: false,
      error: `Missing required valuationData fields: ${missingValuationFields.join(', ')}`
    };
  }
  
  // Validate mileage is a positive number
  if (typeof requestData.mileage !== 'number' || requestData.mileage < 0) {
    return {
      valid: false,
      error: 'Mileage must be a positive number'
    };
  }
  
  return { valid: true };
}
