/**
 * Changes made:
 * - 2024-08-17: Created centralized timeout utilities for standardized timeout management
 */

// Standard timeout durations in milliseconds
export const TimeoutDurations = {
  SHORT: 3000,          // 3 seconds - for quick operations, toasts
  STANDARD: 5000,       // 5 seconds - default duration for most operations
  MEDIUM: 10000,        // 10 seconds - for moderate operations like data fetching
  LONG: 20000,          // 20 seconds - for longer operations like uploads
  EXTENDED: 30000,      // 30 seconds - for complex operations like submissions
  CRITICAL: 60000       // 60 seconds - for critical operations that must complete
} as const;

export type TimeoutDuration = typeof TimeoutDurations[keyof typeof TimeoutDurations];

/**
 * Creates a managed timeout that will be automatically cleared when the returned
 * clear function is called. Provides a type-safe wrapper around setTimeout.
 * 
 * @param callback Function to execute after timeout
 * @param duration Timeout duration in milliseconds
 * @returns Object with clear() method to cancel the timeout and a promise that resolves when the timeout completes
 */
export const createTimeout = (
  callback: () => void, 
  duration: number = TimeoutDurations.STANDARD
) => {
  // Create timeout ID reference
  let timeoutId: NodeJS.Timeout | null = null;
  
  // Create a promise that resolves when the timeout completes
  const timeoutPromise = new Promise<void>((resolve) => {
    timeoutId = setTimeout(() => {
      callback();
      resolve();
      timeoutId = null;
    }, duration);
  });
  
  // Return an object with clear method and the promise
  return {
    clear: () => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    },
    promise: timeoutPromise
  };
};

/**
 * Creates a race condition between a promise and a timeout.
 * If the promise resolves before the timeout, the timeout is cleared.
 * If the timeout occurs first, the returned promise rejects with a timeout error.
 * 
 * @param promise The promise to race against the timeout
 * @param duration Timeout duration in milliseconds
 * @param errorMessage Custom error message for timeout
 * @returns A promise that resolves with the original promise's value or rejects with a timeout error
 */
export const withTimeout = <T>(
  promise: Promise<T>,
  duration: number = TimeoutDurations.MEDIUM,
  errorMessage: string = "Operation timed out"
): Promise<T> => {
  // Create a timeout promise that rejects after the specified duration
  const timeoutPromise = new Promise<T>((_, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(errorMessage));
    }, duration);
    
    // Ensure the timeout is cleared if promise resolves first
    promise.finally(() => clearTimeout(timeoutId));
  });
  
  // Race the original promise against the timeout
  return Promise.race([promise, timeoutPromise]);
};

/**
 * Hook for managing timeouts in React components
 * Ensures all timeouts are cleared when the component unmounts
 */
export const useTimeoutManager = () => {
  // Keep track of active timeouts
  const timeoutIds = React.useRef<Set<NodeJS.Timeout>>(new Set());
  
  // Clear all timeouts when component unmounts
  React.useEffect(() => {
    return () => {
      timeoutIds.current.forEach(id => clearTimeout(id));
      timeoutIds.current.clear();
    };
  }, []);
  
  /**
   * Creates a managed timeout that will be automatically cleared when the component unmounts
   */
  const setTimeout = React.useCallback((callback: () => void, duration: number): NodeJS.Timeout => {
    const id = global.setTimeout(() => {
      callback();
      timeoutIds.current.delete(id);
    }, duration);
    
    timeoutIds.current.add(id);
    return id;
  }, []);
  
  /**
   * Clears a specific timeout and removes it from tracking
   */
  const clearTimeout = React.useCallback((id: NodeJS.Timeout) => {
    global.clearTimeout(id);
    timeoutIds.current.delete(id);
  }, []);
  
  return {
    setTimeout,
    clearTimeout,
    clearAll: React.useCallback(() => {
      timeoutIds.current.forEach(id => global.clearTimeout(id));
      timeoutIds.current.clear();
    }, [])
  };
};

/**
 * Creates a promise that resolves after the specified duration
 * Useful for creating artificial delays
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Missing import for React
import React from 'react';
