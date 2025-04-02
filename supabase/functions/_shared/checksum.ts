
/**
 * Checksum generation for API authentication
 */
import * as md5 from "https://esm.sh/js-md5@0.8.3";

/**
 * Generate a checksum for the valuation API request
 * 
 * @param apiId API ID
 * @param apiSecret API secret key
 * @param vin Vehicle Identification Number
 * @returns MD5 hash of the concatenated parameters
 */
export function generateChecksum(apiId: string, apiSecret: string, vin: string): string {
  return md5.default(apiId + apiSecret + vin);
}

/**
 * Validates a checksum against expected values
 * 
 * @param checksum The checksum to validate
 * @param apiId API ID
 * @param apiSecret API secret key
 * @param vin Vehicle Identification Number
 * @returns Boolean indicating if checksum is valid
 */
export function validateChecksum(checksum: string, apiId: string, apiSecret: string, vin: string): boolean {
  const expectedChecksum = generateChecksum(apiId, apiSecret, vin);
  return checksum === expectedChecksum;
}
