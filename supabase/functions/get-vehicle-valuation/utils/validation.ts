
/**
 * Validation utilities for get-vehicle-valuation
 * Created: 2025-04-30 - Added more robust validation for VIN and request parameters
 */

export function isValidVin(vin: string): boolean {
  // First, basic null/undefined check
  if (vin === null || vin === undefined) {
    return false;
  }
  
  // Convert to string if it's not already
  const vinString = String(vin);
  
  // Clean the VIN string
  const cleanVin = vinString.trim().toUpperCase();
  
  // Empty check
  if (cleanVin.length === 0) {
    return false;
  }
  
  // Super permissive VIN validation - literally any alphanumeric string between 5-17 chars
  // This should accept even partial or custom VINs
  return cleanVin.length >= 5 && 
         cleanVin.length <= 17 && 
         /^[A-Z0-9]+$/i.test(cleanVin);
}

export function isValidMileage(mileage: any): boolean {
  // Handle string or number input
  if (mileage === null || mileage === undefined || mileage === '') {
    return false;
  }
  
  const mileageNum = typeof mileage === 'string' ? parseInt(mileage, 10) : Number(mileage);
  
  // Check if conversion was successful and value is in reasonable range
  return !isNaN(mileageNum) && mileageNum >= 0 && mileageNum <= 1000000;
}

export function validateRequest(data: any): { valid: boolean; error?: string } {
  // Basic request validation
  if (!data) {
    return { 
      valid: false, 
      error: 'Request body is required' 
    };
  }
  
  // Detailed validation logging for debugging
  console.log({
    timestamp: new Date().toISOString(),
    operation: 'validating_request_details',
    dataType: typeof data,
    dataIsObject: data instanceof Object,
    dataKeys: Object.keys(data),
    vinPresent: 'vin' in data,
    vinValue: data.vin,
    vinType: typeof data.vin,
    vinLength: data.vin ? String(data.vin).length : 0,
    mileagePresent: 'mileage' in data,
    mileageValue: data.mileage,
    mileageType: typeof data.mileage,
    gearboxPresent: 'gearbox' in data,
    gearboxValue: data.gearbox
  });

  // Check VIN presence, with clear error
  if (!('vin' in data)) {
    return { 
      valid: false, 
      error: 'VIN parameter is missing in request' 
    };
  }

  // Convert empty strings, nulls to clearly defined invalid values for better error messages
  const vin = data.vin || '';
  
  // More flexible VIN validation with informative error
  const cleanedVin = String(vin).trim().replace(/[^A-Z0-9]/gi, '');
  if (cleanedVin.length < 5) {
    return { 
      valid: false, 
      error: cleanedVin === '' ? 'VIN cannot be empty' : 
             `VIN too short after sanitization: "${cleanedVin}". Must be at least 5 alphanumeric characters.` 
    };
  }

  if (cleanedVin.length > 17) {
    return {
      valid: false,
      error: `VIN too long: "${cleanedVin}". Must be at most 17 characters.`
    };
  }

  // Check mileage presence
  if (!('mileage' in data)) {
    return { 
      valid: false, 
      error: 'Mileage parameter is missing in request' 
    };
  }

  // Mileage validation
  if (!isValidMileage(data.mileage)) {
    return { 
      valid: false, 
      error: data.mileage === '' || data.mileage === null || data.mileage === undefined ? 
             'Mileage cannot be empty' :
             'Invalid mileage. Must be a number between 0 and 1,000,000.' 
    };
  }

  // Accept any gearbox value if present, default if missing
  if (!('gearbox' in data)) {
    data.gearbox = 'manual'; // Set default
    console.log('Missing gearbox parameter, defaulting to "manual"');
  }

  return { valid: true };
}
