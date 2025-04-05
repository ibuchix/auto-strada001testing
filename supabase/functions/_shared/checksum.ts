
/**
 * Shared utility for generating checksums
 */
import { createHash } from "https://deno.land/std@0.177.0/hash/mod.ts";

/**
 * Generate a checksum for the valuation API
 * @param apiId API ID
 * @param apiSecret API secret key
 * @param vin Vehicle identification number
 * @returns MD5 checksum
 */
export function generateChecksum(apiId: string, apiSecret: string, vin: string): string {
  const data = `${apiId}${apiSecret}${vin}`;
  return createHash("md5").update(data).toString();
}
