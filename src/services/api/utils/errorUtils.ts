
/**
 * Error handling utilities for API client
 * 
 * Changes made:
 * - 2025-11-05: Created as part of apiClientService refactoring
 * - Extracted error handling logic from monolithic apiClientService
 * - 2026-05-10: Enhanced with better network detection and categorization
 * - 2026-05-13: Fixed constructor usage to match ApiError interface
 */

import { toast } from "sonner";
import { 
  createNetworkError, 
  createTimeoutError,
  createSubmissionError,
  handleAppError
} from "@/errors/factory";
import { ApiRequestConfig, ApiResponse } from "../types/apiTypes";
import { ApiError } from "@/services/errors/apiError";

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
  
  // Detect network connectivity issues
  if (!navigator.onLine) {
    const networkError = new ApiError({
      message: "You are currently offline. Please check your internet connection.",
      originalError: error,
      statusCode: 0,
      errorCode: 'OFFLINE',
      category: 'network'
    });
    
    return {
      data: null,
      error: networkError,
      status: 0
    };
  }
  
  // Detect error type and create normalized ApiError
  let status = 500;
  let category: 'network' | 'validation' | 'authentication' | 'server' | 'unknown' = 'unknown';
  let isNetworkError = false;
  let errorCode = '';
  
  if (error.status) {
    status = error.status;
  } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    status = 408; // Request Timeout
    category = 'network';
    isNetworkError = true;
    errorCode = 'TIMEOUT';
  } else if (error.message?.includes('network') || error.message?.includes('connection')) {
    status = 0; // Network Error
    category = 'network';
    isNetworkError = true;
    errorCode = 'NETWORK_ERROR';
  } else if (error.code === 'UNAUTHORIZED' || error.message?.includes('unauthorized')) {
    status = 401;
    category = 'authentication';
    errorCode = 'UNAUTHORIZED';
  } else if (error.code === 'FORBIDDEN' || error.message?.includes('forbidden')) {
    status = 403;
    category = 'authentication';
    errorCode = 'FORBIDDEN';
  } else if (error.code === 'NOT_FOUND' || error.message?.includes('not found')) {
    status = 404;
    category = 'server';
    errorCode = 'NOT_FOUND';
  }
  
  const apiError = new ApiError({
    message: error.message || 'An error occurred',
    originalError: error,
    statusCode: status,
    errorCode,
    category
  });
  
  return {
    data: null,
    error: apiError,
    status
  };
}

/**
 * Check if an error is likely due to network connectivity issues
 */
export function isNetworkError(error: any): boolean {
  // Check for browser's online status
  if (!navigator.onLine) {
    return true;
  }
  
  // Check common network error patterns
  if (error instanceof ApiError) {
    return error.isNetworkError;
  }
  
  // Check error message
  if (error.message) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('connection') ||
      message.includes('internet') ||
      message.includes('offline') ||
      message.includes('timeout') ||
      message.includes('timed out')
    );
  }
  
  // Check error code
  if (error.code) {
    return (
      error.code === 'ECONNREFUSED' ||
      error.code === 'ECONNRESET' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ENETUNREACH' ||
      error.code === 'NETWORK_ERROR'
    );
  }
  
  // Check status
  return error.status === 0 || error.status === 408;
}
