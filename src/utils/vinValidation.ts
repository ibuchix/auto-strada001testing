
/**
 * Utility functions for VIN validation
 * Created: 2025-04-10
 * Updated: 2025-04-18 - Enhanced error messaging and format normalization
 * Updated: 2025-04-19 - Improved VIN normalization to handle common input errors
 */

/**
 * Validates the format of a Vehicle Identification Number (VIN)
 * 
 * @param vin The VIN to validate
 * @returns Boolean indicating if the VIN has a valid format
 */
export function isValidVIN(vin: string): boolean {
  if (!vin) {
    return false;
  }
  
  // Normalize the VIN first
  const normalizedVin = normalizeVIN(vin);
  
  // Basic validation - VIN should be 17 characters and contain only valid characters
  if (normalizedVin.length !== 17) {
    return false;
  }
  
  // VINs should only contain alphanumeric characters, excluding I, O, and Q
  // which are not used to avoid confusion with 1 and 0
  const validPattern = /^[A-HJ-NPR-Z0-9]{17}$/i;
  return validPattern.test(normalizedVin);
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
  
  // Normalize the VIN first
  const normalizedVin = normalizeVIN(vin);
  
  if (normalizedVin.length !== 17) {
    return `VIN must be exactly 17 characters (currently ${normalizedVin.length})`;
  }
  
  if (!/^[A-HJ-NPR-Z0-9]{17}$/i.test(normalizedVin)) {
    // Check for specific invalid characters to provide more helpful error messages
    const invalidChars = normalizedVin.match(/[^A-HJ-NPR-Z0-9]/gi);
    if (invalidChars) {
      return `VIN contains invalid characters: ${invalidChars.join(', ')}. Only letters (except I, O, Q) and numbers are allowed.`;
    }
    
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
  if (!vin) return '';
  
  // Remove whitespace, dashes, and convert to uppercase
  let normalized = vin.trim().toUpperCase().replace(/[\s-]/g, '');
  
  // Replace commonly confused characters
  normalized = normalized.replace(/[IOQ]/g, (match) => {
    // Common replacements for confused characters
    if (match === 'I') return '1';
    if (match === 'O') return '0';
    if (match === 'Q') return '0';
    return match;
  });
  
  return normalized;
}

/**
 * Checks if a VIN is likely a test/sample VIN
 * Some systems use placeholder VINs for testing that may not validate through normal services
 * 
 * @param vin The VIN to check
 * @returns Boolean indicating if the VIN appears to be a test VIN
 */
export function isTestVIN(vin: string): boolean {
  if (!vin) return false;
  
  const normalized = normalizeVIN(vin);
  
  // Common patterns for test VINs
  const testPatterns = [
    /^TEST/i,
    /^SAMPLE/i,
    /^DEMO/i,
    /^123/,
    /^000/,
    /^111/,
    /^ZZZ/,
    /^XXX/,
    /TESTVIN/i
  ];
  
  return testPatterns.some(pattern => pattern.test(normalized));
}

/**
 * Check if a VIN looks realistic enough to attempt validation
 * This helps filter out obviously invalid inputs before making API requests
 * 
 * @param vin The VIN to check
 * @returns Boolean indicating if the VIN is realistic enough to validate
 */
export function isRealisticVIN(vin: string): boolean {
  if (!vin) return false;
  
  const normalized = normalizeVIN(vin);
  
  // Must be 17 characters
  if (normalized.length !== 17) return false;
  
  // Must not be a test VIN
  if (isTestVIN(normalized)) return false;
  
  // Must not contain obviously repeated patterns
  if (/(.)\1{5,}/.test(normalized)) return false; // 6+ of the same character in a row
  
  return true;
}
