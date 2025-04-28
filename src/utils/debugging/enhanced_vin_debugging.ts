
/**
 * Enhanced VIN debugging and validation utilities
 * Created: 2025-05-01 - For improved error detection and recovery
 */

interface ValidationResult {
  valid: boolean;
  error?: string;
  cleanedParams?: {
    vin: string;
    mileage: number;
    gearbox: string;
  };
}

/**
 * Validates and normalizes valuation parameters before making API calls
 */
export function validateValuationParams(
  vin: string | null | undefined,
  mileage: number | string | null | undefined,
  gearbox: string | null | undefined = 'manual'
): ValidationResult {
  // VIN validation
  if (!vin) {
    return {
      valid: false,
      error: 'VIN is required'
    };
  }

  const cleanedVin = String(vin).trim().toUpperCase();
  
  if (cleanedVin.length < 5 || cleanedVin.length > 17) {
    return {
      valid: false,
      error: `Invalid VIN length: ${cleanedVin.length}. Must be between 5 and 17 characters.`
    };
  }

  // Only allow alphanumeric characters in VIN
  if (!/^[A-Z0-9]+$/.test(cleanedVin)) {
    return {
      valid: false,
      error: 'VIN must contain only letters and numbers'
    };
  }

  // Mileage validation
  let numericMileage: number;
  
  if (mileage === null || mileage === undefined) {
    return {
      valid: false,
      error: 'Mileage is required'
    };
  }
  
  if (typeof mileage === 'string') {
    numericMileage = parseInt(mileage, 10);
  } else {
    numericMileage = Number(mileage);
  }
  
  if (isNaN(numericMileage)) {
    return {
      valid: false,
      error: 'Mileage must be a number'
    };
  }
  
  if (numericMileage < 0 || numericMileage > 1000000) {
    return {
      valid: false,
      error: 'Mileage must be between 0 and 1,000,000'
    };
  }

  // Gearbox validation
  const cleanedGearbox = (gearbox || 'manual').toLowerCase();
  
  if (cleanedGearbox !== 'manual' && cleanedGearbox !== 'automatic') {
    console.warn(`Unusual gearbox value: "${gearbox}", defaulting to "manual"`);
  }

  // Return valid result with cleaned parameters
  return {
    valid: true,
    cleanedParams: {
      vin: cleanedVin,
      mileage: numericMileage,
      gearbox: cleanedGearbox === 'automatic' ? 'automatic' : 'manual'
    }
  };
}

/**
 * Logs detailed information about a valuation request
 */
export function logValuationRequest(
  requestId: string,
  vin: string,
  mileage: number | string,
  gearbox?: string
) {
  console.log(`[ValuationDebug:${requestId}] Request details:`, {
    vin: {
      value: vin,
      length: String(vin).length,
      trimmed: String(vin).trim(),
      uppercased: String(vin).toUpperCase()
    },
    mileage: {
      value: mileage,
      type: typeof mileage,
      asNumber: Number(mileage)
    },
    gearbox: gearbox || 'manual',
    timestamp: new Date().toISOString()
  });
}
