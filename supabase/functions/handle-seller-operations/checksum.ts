
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
