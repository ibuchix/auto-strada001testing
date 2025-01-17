import { corsHeaders } from "./cors.ts";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

export async function calculateChecksum(apiId: string, apiSecret: string, vin: string): Promise<string> {
  console.log('Calculating checksum for:', { apiId, vin });
  
  const input = `${apiId}${apiSecret}${vin}`;
  console.log('Raw input string:', input);
  
  // Create MD5 hash using TextEncoder and crypto subtle
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('MD5', data);
  
  // Convert hash to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const checksum = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  console.log('Calculated MD5 checksum:', checksum);
  return checksum;
}