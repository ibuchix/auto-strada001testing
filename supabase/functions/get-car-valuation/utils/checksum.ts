import { corsHeaders } from "./cors.ts";
import { createHash } from "https://deno.land/std@0.168.0/hash/mod.ts";

export async function calculateChecksum(apiId: string, apiSecret: string, vin: string): Promise<string> {
  console.log('Calculating checksum for:', { apiId, vin });
  
  const input = `${apiId}${apiSecret}${vin}`;
  console.log('Raw input string:', input);
  
  // Create MD5 hash using Deno's hash implementation
  const hash = createHash("md5");
  hash.update(input);
  const checksum = hash.toString();
  
  console.log('Calculated MD5 checksum:', checksum);
  return checksum;
}