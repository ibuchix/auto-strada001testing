
/**
 * Changes made:
 * - 2024-07-22: Extracted validation utility functions from utils.ts
 */

import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";
import { logOperation } from './logging.ts';

/**
 * Enhanced error handling with specific error types
 */
export class ValidationError extends Error {
  code: string;
  
  constructor(message: string, code: string) {
    super(message);
    this.name = 'ValidationError';
    this.code = code;
  }
}

export function calculateMD5(input: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hash = crypto.subtle.digestSync("MD5", data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

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

/**
 * Helper function for retry logic
 */
export async function withRetry<T>(
  operation: () => Promise<T>, 
  maxRetries: number = 3, 
  delay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      logOperation('retry_attempt', { 
        attempt, 
        maxRetries, 
        error: error.message || 'Unknown error'
      }, 'warn');
      
      if (attempt < maxRetries) {
        // Exponential backoff
        const backoffDelay = delay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  }
  
  throw lastError || new Error('Operation failed after maximum retries');
}
