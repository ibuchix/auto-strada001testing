
/**
 * Validation utilities for get-vehicle-valuation
 * Updated: 2025-04-28 - Improved request validation and logging
 */

export function isValidVin(vin: string): boolean {
  if (!vin || typeof vin !== 'string') {
    return false;
  }
  
  // Clean the VIN string
  const cleanVin = vin.trim().toUpperCase();
  
  // Very permissive VIN validation
  return cleanVin.length >= 10 && 
         cleanVin.length <= 17 && 
         /^[A-Z0-9]+$/i.test(cleanVin);
}

export function isValidMileage(mileage: any): boolean {
  // Handle string or number input
  const mileageNum = typeof mileage === 'string' ? parseInt(mileage, 10) : mileage;
  return !isNaN(mileageNum) && mileageNum >= 0 && mileageNum <= 1000000;
}

export function validateRequest(data: any): { valid: boolean; error?: string } {
  if (!data) {
    return { 
      valid: false, 
      error: 'Request body is required' 
    };
  }

  // Log validation attempt with detailed data structure
  console.log({
    timestamp: new Date().toISOString(),
    operation: 'validating_request',
    requestType: typeof data,
    hasVin: Boolean(data.vin),
    vinType: typeof data.vin,
    vinLength: data.vin ? data.vin.length : 0,
    hasMileage: data.mileage !== undefined,
    mileageType: typeof data.mileage,
    mileageValue: data.mileage,
    hasGearbox: Boolean(data.gearbox)
  });

  if (!data.vin) {
    return { 
      valid: false, 
      error: 'VIN is required' 
    };
  }

  if (!isValidVin(data.vin)) {
    return { 
      valid: false, 
      error: `Invalid VIN format: "${data.vin}". Must be between 10-17 alphanumeric characters.` 
    };
  }

  if (!isValidMileage(data.mileage)) {
    return { 
      valid: false, 
      error: 'Invalid mileage. Must be a number between 0 and 1,000,000.' 
    };
  }

  return { valid: true };
}
