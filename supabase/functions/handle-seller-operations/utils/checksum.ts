
/**
 * Checksum calculation utilities
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

