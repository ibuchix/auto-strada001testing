import { corsHeaders } from "./cors.ts";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";
import { Md5 } from "https://deno.land/std@0.177.0/hash/md5.ts";

export async function calculateChecksum(apiId: string, apiSecret: string, vin: string): Promise<string> {
  console.log('Calculating checksum for:', { apiId, vin });
  
  const input = `${apiId}${apiSecret}${vin}`;
  console.log('Raw input string:', input);
  
  // Create MD5 hash using Deno's native MD5 implementation
  const md5 = new Md5();
  md5.update(input);
  const checksum = md5.toString();
  
  console.log('Calculated MD5 checksum:', checksum);
  return checksum;
}