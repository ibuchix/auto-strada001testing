
/**
 * Changes made:
 * - 2024-06-22: Enhanced with checksum calculation functionality from operations.ts
 * - 2024-07-07: Added rate limiting, improved error handling, and enhanced logging
 */

import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

// Simple in-memory rate limiter
const rateLimits = new Map<string, { count: number, resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 10; // Maximum 10 requests per minute per VIN

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

/**
 * Check rate limits for a specific VIN
 * @param vin The VIN to check rate limits for
 * @returns boolean indicating if rate limit is exceeded
 */
export function checkRateLimit(vin: string): boolean {
  const now = Date.now();
  
  // Clean up expired rate limits
  for (const [key, limit] of rateLimits.entries()) {
    if (now > limit.resetTime) {
      rateLimits.delete(key);
    }
  }
  
  // Check if VIN exists in rate limiter
  if (!rateLimits.has(vin)) {
    rateLimits.set(vin, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return false;
  }
  
  // Update and check limit
  const limit = rateLimits.get(vin)!;
  if (limit.count >= MAX_REQUESTS_PER_WINDOW) {
    console.warn(`Rate limit exceeded for VIN: ${vin}`);
    return true;
  }
  
  // Increment counter
  limit.count++;
  return false;
}

/**
 * Log operations with enhanced details
 */
export function logOperation(operation: string, details: Record<string, any>, level: 'info' | 'warn' | 'error' = 'info'): void {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    operation,
    ...details
  };
  
  switch (level) {
    case 'info':
      console.log(`[INFO][${timestamp}] ${operation}:`, JSON.stringify(logData));
      break;
    case 'warn':
      console.warn(`[WARN][${timestamp}] ${operation}:`, JSON.stringify(logData));
      break;
    case 'error':
      console.error(`[ERROR][${timestamp}] ${operation}:`, JSON.stringify(logData));
      break;
  }
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
