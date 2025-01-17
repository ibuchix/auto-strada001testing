import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "./cors.ts";

export async function calculateChecksum(apiId: string, apiSecret: string, vin: string): Promise<string> {
  console.log('Calculating checksum for:', { apiId, vin });
  
  const input = `${apiId}${apiSecret}${vin}`;
  console.log('Raw input string:', input);
  
  // Convert string to Uint8Array
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  
  // Calculate MD5-like hash using available algorithms
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  
  // Convert to hex string and take first 32 characters to match MD5 length
  const checksum = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
  
  // Log test case validation
  const testVin = 'WAUZZZ8K79A090954';
  const testInput = `${apiId}${apiSecret}${testVin}`;
  const testData = encoder.encode(testInput);
  const testHashBuffer = await crypto.subtle.digest('SHA-256', testData);
  const testHashArray = Array.from(new Uint8Array(testHashBuffer));
  const testChecksum = testHashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
  
  console.log('Checksum calculation details:', {
    input: input,
    checksum: checksum,
    testCase: {
      input: testInput,
      checksum: testChecksum,
      expectedChecksum: '6c6f042d5c5c4ce3c3b3a7e752547ae0',
      matches: testChecksum === '6c6f042d5c5c4ce3c3b3a7e752547ae0'
    }
  });
  
  return checksum;
}