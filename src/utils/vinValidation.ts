
/**
 * VIN Validation Utilities
 * Created: 2025-05-02 - Centralizes VIN validation and normalization
 */

/**
 * Checks if a VIN is valid according to our requirements
 */
export function isValidVIN(vin?: string): boolean {
  if (!vin) return false;
  
  // Convert to string, trim whitespace, and remove non-alphanumeric characters
  const cleanVin = normalizeVIN(vin);
  
  // VIN must be between 5 and 17 characters
  // (full VINs are 17 characters, but we allow partial VINs with at least 5 chars)
  return cleanVin.length >= 5 && cleanVin.length <= 17;
}

/**
 * Normalizes a VIN by trimming whitespace, removing special characters, and converting to uppercase
 */
export function normalizeVIN(vin?: string): string {
  if (!vin) return '';
  
  return String(vin)
    .trim()
    .replace(/[^A-Z0-9]/gi, '') // Remove any non-alphanumeric characters
    .toUpperCase();
}

/**
 * Get error message for invalid VIN
 */
export function getVINErrorMessage(vin?: string): string | null {
  if (!vin) return "VIN is required";
  
  const cleanVin = normalizeVIN(vin);
  
  if (cleanVin.length === 0) return "VIN is required";
  if (cleanVin.length < 5) return "VIN must be at least 5 characters";
  if (cleanVin.length > 17) return "VIN cannot be longer than 17 characters";
  
  return null; // VIN is valid
}
