
/**
 * Changes made:
 * - 2024-06-22: Enhanced with checksum calculation functionality from operations.ts
 */

import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

export function calculateMD5(input: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hash = crypto.subtle.digestSync("MD5", data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Calculates checksum for API requests
 */
export const calculateChecksum = async (vin: string): Promise<string> => {
  // Use the API credentials from the instructions
  const apiId = "AUTOSTRA";
  const apiSecret = "A4FTFH54C3E37P2D34A16A7A4V41XKBF";
  
  // Calculate the checksum as md5(api id + api secret key + vin)
  const encoder = new TextEncoder();
  const data = encoder.encode(apiId + apiSecret + vin);
  const hashBuffer = await crypto.subtle.digest('MD5', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
};
