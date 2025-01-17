import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "./cors.ts";
import { createHash } from "https://deno.land/std@0.177.0/hash/mod.ts";

export async function calculateChecksum(apiId: string, apiSecret: string, vin: string): Promise<string> {
  console.log('Starting checksum calculation:', { apiId, vin });
  
  try {
    if (!apiId || !apiSecret || !vin) {
      throw new Error('Missing required parameters for checksum calculation');
    }

    const input = `${apiId}${apiSecret}${vin}`;
    console.log('Raw input string:', input);
    
    // Create MD5 hash using Deno's built-in hash function
    const hash = createHash('md5');
    hash.update(input);
    const checksum = hash.toString();
    
    // Validate with test case
    const testVin = 'WAUZZZ8K79A090954';
    const testInput = `${apiId}${apiSecret}${testVin}`;
    const testHash = createHash('md5');
    testHash.update(testInput);
    const testChecksum = testHash.toString();
    
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

    if (testChecksum !== '6c6f042d5c5c4ce3c3b3a7e752547ae0') {
      console.warn('Test case validation failed - checksum calculation might be incorrect');
    }
    
    return checksum;
  } catch (error) {
    console.error('Error calculating checksum:', error);
    throw new Error(`Failed to calculate checksum: ${error.message}`);
  }
}