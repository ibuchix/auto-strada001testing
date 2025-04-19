
/**
 * Checksum calculation utilities
 * Created: 2025-04-19 - Extracted from shared module
 */

/**
 * Calculate MD5 checksum for valuation API
 * @param apiId API identifier
 * @param apiSecret API secret key
 * @param vin Vehicle identification number
 * @returns MD5 checksum as hex string
 */
export async function calculateChecksum(
  apiId: string,
  apiSecret: string,
  vin: string
): Promise<string> {
  const input = `${apiId}${apiSecret}${vin}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  
  const hashBuffer = await crypto.subtle.digest('MD5', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

/**
 * Validate whether provided checksum matches calculated checksum
 * @param providedChecksum Checksum to validate
 * @param apiId API identifier
 * @param apiSecret API secret key
 * @param vin Vehicle identification number
 * @returns Boolean indicating if checksums match
 */
export async function validateChecksum(
  providedChecksum: string,
  apiId: string,
  apiSecret: string,
  vin: string
): Promise<boolean> {
  const calculatedChecksum = await calculateChecksum(apiId, apiSecret, vin);
  return calculatedChecksum.toLowerCase() === providedChecksum.toLowerCase();
}
