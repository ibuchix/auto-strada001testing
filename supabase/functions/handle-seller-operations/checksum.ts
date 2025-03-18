
/**
 * Changes made:
 * - 2024-07-22: Extracted checksum calculation functionality
 */

import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";
import { logOperation } from './utils.ts';

/**
 * Calculates checksum for API requests using the API credentials
 */
export const calculateChecksum = async (vin: string): Promise<string> => {
  const apiId = "AUTOSTRA";
  const apiSecret = "A4FTFH54C3E37P2D34A16A7A4V41XKBF";
  
  // Calculate the checksum as md5(api id + api secret key + vin)
  const encoder = new TextEncoder();
  const data = encoder.encode(apiId + apiSecret + vin);
  const hashBuffer = await crypto.subtle.digest('MD5', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  logOperation('calculated_checksum', { vin, checksum: hashHex });
  return hashHex;
};
