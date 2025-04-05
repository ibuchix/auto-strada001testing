
/**
 * Checksum utilities for API requests
 */

/**
 * Generate a checksum for API authentication
 * @param apiId API identifier
 * @param apiSecret API secret key
 * @param vin Vehicle identification number
 * @returns MD5 hash checksum
 */
export async function generateChecksum(apiId: string, apiSecret: string, vin: string): Promise<string> {
  // Create input string
  const input = `${apiId}${apiSecret}${vin}`;
  
  // Encode to bytes
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  
  // Generate MD5 hash
  const hashBuffer = await crypto.subtle.digest('MD5', data);
  
  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}
