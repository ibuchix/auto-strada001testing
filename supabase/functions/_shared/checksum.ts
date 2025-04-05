
/**
 * Shared utility for generating checksums
 * Updated to use built-in Deno crypto instead of external module
 */

/**
 * Generate a checksum for the valuation API
 * @param apiId API ID
 * @param apiSecret API secret key
 * @param vin Vehicle identification number
 * @returns MD5 checksum
 */
export function generateChecksum(apiId: string, apiSecret: string, vin: string): string {
  const data = `${apiId}${apiSecret}${vin}`;
  const encoder = new TextEncoder();
  const dataEncoded = encoder.encode(data);
  
  // Use the built-in crypto API to create an MD5 hash
  const hashBuffer = crypto.subtle.digestSync("MD5", dataEncoded);
  
  // Convert the hash buffer to a hex string
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
