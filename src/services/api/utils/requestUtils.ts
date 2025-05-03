
/**
 * Request utilities for API client
 * 
 * Changes made:
 * - 2025-11-05: Created as part of apiClientService refactoring
 * - Extracted request handling logic from monolithic apiClientService
 * - 2025-05-10: Fixed createTimeoutError function call to match signature
 */

import { toast } from "sonner";
import { createTimeoutError } from "@/errors/factory";
import { ApiRequestConfig } from "../types/apiTypes";
import { DEFAULT_TIMEOUT } from "../constants/timeouts";

/**
 * Execute a request with proper timeout handling and success messaging
 */
export async function makeRequest<T>(
  requestFunction: () => Promise<T>,
  config: ApiRequestConfig = {}
): Promise<T> {
  const { timeout = DEFAULT_TIMEOUT, successMessage, idempotencyKey } = config;
  
  // Create a promise that will reject after the timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(createTimeoutError('Request timed out'));
    }, timeout);
  });
  
  // Race the request against the timeout
  const result = await Promise.race([requestFunction(), timeoutPromise]);
  
  // Show success message if provided
  if (successMessage && !config.silent) {
    toast.success(successMessage);
  }
  
  return result;
}
