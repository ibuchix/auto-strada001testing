import { corsHeaders } from "./cors.ts";

export async function calculateChecksum(apiId: string, apiSecret: string, vin: string): Promise<string> {
  console.log('Calculating checksum for:', { apiId, vin });
  const input = `${apiId}${apiSecret}${vin}`;
  
  // Convert string to Uint8Array for hashing
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  
  // Calculate SHA-256 hash asynchronously
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const checksum = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  console.log('Calculated checksum:', checksum);
  return checksum;
}