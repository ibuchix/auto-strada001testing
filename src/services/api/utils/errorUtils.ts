
/**
 * Error handling utilities for API client
 * 
 * Changes made:
 * - 2025-11-05: Created as part of apiClientService refactoring
 * - Extracted error handling logic from monolithic apiClientService
 */

import { toast } from "sonner";
import { 
  createNetworkError, 
  createTimeoutError,
  createSubmissionError,
  handleAppError
} from "@/errors/factory";
import { ApiRequestConfig, ApiResponse } from "../types/apiTypes";

/**
 * Normalize errors into a consistent format
 */
export function normalizeError<T>(error: any, config: ApiRequestConfig): ApiResponse<T> {
  console.error('API request error:', error);
  
  // Don't show toast for silent requests
  if (!config.silent) {
    try {
      handleAppError(error);
    } catch (e) {
      // Fallback error handling if our standard handler fails
      toast.error(error.message || 'An error occurred');
    }
  }
  
  // Detect error type
  let status = 500;
  
  if (error.status) {
    status = error.status;
  } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    status = 408; // Request Timeout
  } else if (error.message?.includes('network') || error.message?.includes('connection')) {
    status = 0; // Network Error
  } else if (error.code === 'UNAUTHORIZED' || error.message?.includes('unauthorized')) {
    status = 401;
  } else if (error.code === 'FORBIDDEN' || error.message?.includes('forbidden')) {
    status = 403;
  } else if (error.code === 'NOT_FOUND' || error.message?.includes('not found')) {
    status = 404;
  }
  
  return {
    data: null,
    error,
    status
  };
}
