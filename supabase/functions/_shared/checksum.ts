
/**
 * Checksum generation utilities for API authentication
 */

/**
 * Generate MD5 checksum for the valuation API
 */
export function generateChecksum(apiId: string, apiSecret: string, vin: string): string {
  // Create a simple crypto implementation that works in Deno
  const encoder = new TextEncoder();
  const data = encoder.encode(apiId + apiSecret + vin);
  
  return md5(data);
}

/**
 * MD5 hash implementation
 * Based on a simplified version that works in Deno environments
 */
function md5(data: Uint8Array): string {
  const crypto = Deno.createHash("md5");
  crypto.update(data);
  return crypto.digest("hex");
}
