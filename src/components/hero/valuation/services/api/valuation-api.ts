
/**
 * Changes made:
 * - 2024-07-25: Extracted API communication from valuationService.ts
 */

import { supabase } from "@/integrations/supabase/client";
import { ValuationResult, TransmissionType } from "../../types";

// Maximum number of retries for API calls
const MAX_RETRIES = 2;
// Timeout in milliseconds
const REQUEST_TIMEOUT = 30000;

/**
 * Execute a function with retry logic
 */
export async function executeWithRetry<T>(fn: () => Promise<T>, maxRetries: number): Promise<T> {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`Retry attempt ${attempt}/${maxRetries}`);
        // Exponential backoff: 1s, 2s, 4s...
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
      }
      
      return await fn();
    } catch (error: any) {
      console.error(`Attempt ${attempt} failed:`, error);
      lastError = error;
      
      // Don't retry if it's a client error (4xx)
      if (error.status >= 400 && error.status < 500) {
        break;
      }
    }
  }
  
  throw lastError;
}

/**
 * Create a timeout promise to handle API timeouts
 */
export const createTimeoutPromise = () => {
  return new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error('Request timed out'));
    }, REQUEST_TIMEOUT);
  });
};

/**
 * Fetch valuation from the home page endpoint
 */
export async function fetchHomeValuation(vin: string, mileage: number, gearbox: string) {
  // Call the function with retry logic
  const valuationPromise = executeWithRetry(async () => {
    return await supabase.functions.invoke('get-vehicle-valuation', {
      body: { vin, mileage, gearbox, context: 'home' }
    });
  }, MAX_RETRIES);
  
  // Race against timeout
  return await Promise.race([
    valuationPromise,
    createTimeoutPromise()
  ]);
}

/**
 * Fetch valuation from the seller endpoint
 */
export async function fetchSellerValuation(vin: string, mileage: number, gearbox: string, userId: string) {
  // Call the function with retry logic
  const valuationPromise = executeWithRetry(async () => {
    return await supabase.functions.invoke('handle-seller-operations', {
      body: {
        operation: 'validate_vin',
        vin,
        mileage,
        gearbox,
        userId
      }
    });
  }, MAX_RETRIES);
  
  // Race against timeout
  return await Promise.race([
    valuationPromise,
    createTimeoutPromise()
  ]);
}
