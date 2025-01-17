import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "./cors.ts";

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
  
  // Test with known example from documentation
  const testVin = 'WAUZZZ8K79A090954';
  const testInput = `${apiId}${apiSecret}${testVin}`;
  const testData = encoder.encode(testInput);
  const testHashBuffer = await crypto.subtle.digest('MD5', testData);
  const testHashArray = Array.from(new Uint8Array(testHashBuffer));
  const testChecksum = testHashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  console.log('Test example results:', {
    input: testInput,
    checksum: testChecksum,
    expectedChecksum: '6c6f042d5c5c4ce3c3b3a7e752547ae0',
    matches: testChecksum === '6c6f042d5c5c4ce3c3b3a7e752547ae0'
  });
  
  console.log('Calculated checksum:', checksum);
  return checksum;
}