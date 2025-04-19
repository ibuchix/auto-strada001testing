
/**
 * Checksum utilities for handle-car-listing
 * Created: 2025-04-19 - Extracted from inline implementation
 */

/**
 * Calculate MD5 checksum for API authentication
 * @param apiId API identifier
 * @param apiSecret API secret key
 * @param vin Vehicle identification number
 * @returns MD5 checksum as hexadecimal string
 */
export async function calculateChecksum(apiId: string, apiSecret: string, vin: string): Promise<string> {
  const input = `${apiId}${apiSecret}${vin}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('MD5', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
