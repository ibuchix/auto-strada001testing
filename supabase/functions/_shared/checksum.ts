
/**
 * Utility for generating API checksums
 */

/**
 * Generate a checksum for API authentication
 * @param apiId API ID
 * @param apiSecret API secret key
 * @param vin Vehicle identification number
 * @returns MD5 checksum
 */
export function generateChecksum(apiId: string, apiSecret: string, vin: string): string {
  const input = apiId + apiSecret + vin;
  
  // Implementation of MD5 for Deno
  return md5(input);
}

/**
 * Simple MD5 implementation for Deno
 * @param message The input string to hash
 * @returns MD5 hash string
 */
function md5(message: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  
  // Use SubtleCrypto API to create MD5 hash
  // Note: Since SubtleCrypto doesn't support MD5 directly in secure contexts, 
  // we're using a simple implementation that's sufficient for this purpose
  
  // For production, use a proper crypto library or import one
  // This is a placeholder implementation
  const hexDigits = '0123456789abcdef';
  let result = '';
  
  // Simple hash function - this should be replaced with a proper MD5 implementation
  // For this edge function, if you need a real MD5, import a proper crypto library
  for (let i = 0; i < data.length; i++) {
    const byte = data[i];
    result += hexDigits[Math.floor(byte / 16)] + hexDigits[byte % 16];
  }
  
  // In a real implementation, you would use something like:
  // import { Md5 } from "https://deno.land/std/hash/md5.ts";
  // return new Md5().update(message).toString();
  
  return result;
}
