
/**
 * Generate checksum for vehicle valuations
 * 
 * Updated: Using consistent Deno built-in crypto API
 */

/**
 * Generate a checksum for the valuation API request
 * 
 * @param apiId API ID
 * @param apiSecret API secret key
 * @param vin Vehicle Identification Number
 * @returns MD5 hash of the concatenated parameters
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
