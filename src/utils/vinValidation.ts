
/**
 * Utility functions for VIN validation
 * Created: 2025-04-10
 */

/**
 * Validates the format of a Vehicle Identification Number (VIN)
 * 
 * @param vin The VIN to validate
 * @returns Boolean indicating if the VIN has a valid format
 */
export function isValidVIN(vin: string): boolean {
  // Basic validation - VIN should be 17 characters and contain only valid characters
  if (!vin || vin.length !== 17) {
    return false;
  }
  
  // VINs should only contain alphanumeric characters, excluding I, O, and Q
  // which are not used to avoid confusion with 1 and 0
  const validPattern = /^[A-HJ-NPR-Z0-9]{17}$/i;
  return validPattern.test(vin);
}

/**
 * Get a helpful error message for an invalid VIN
 * 
 * @param vin The VIN to validate
 * @returns Error message or null if VIN is valid
 */
export function getVINErrorMessage(vin: string): string | null {
  if (!vin) {
    return "VIN is required";
  }
  
  if (vin.length !== 17) {
    return `VIN must be exactly 17 characters (currently ${vin.length})`;
  }
  
  if (!/^[A-HJ-NPR-Z0-9]{17}$/i.test(vin)) {
    return "VIN contains invalid characters. Only letters (except I, O, Q) and numbers are allowed.";
  }
  
  return null;
}

/**
 * Normalize a VIN to the standardized format
 * 
 * @param vin The VIN to normalize
 * @returns Normalized VIN
 */
export function normalizeVIN(vin: string): string {
  // Remove whitespace and convert to uppercase
  return vin.trim().toUpperCase()
    // Replace commonly confused characters
    .replace(/[IOQ]/g, (match) => {
      // Common replacements for confused characters
      if (match === 'I') return '1';
      if (match === 'O') return '0';
      if (match === 'Q') return '0';
      return match;
    });
}
