
/**
 * Changes made:
 * - 2024-08-17: Created reusable timeout hook with automatic cleanup
 */

import { useRef, useEffect, useCallback } from 'react';
import { TimeoutDurations } from '@/utils/timeoutUtils';

/**
 * Hook for managing timeouts in React components with automatic cleanup
 * 
 * @param callback Function to execute when timeout completes
 * @param duration Timeout duration in milliseconds
 * @param dependencies Dependencies that will reset the timeout when changed
 * @returns Object with start, stop, reset, and isActive methods
 */
export const useTimeout = (
  callback: () => void,
  duration: number = TimeoutDurations.STANDARD,
  dependencies: any[] = []
) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);
  
  // Update the callback ref when it changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  // Reset the timeout when dependencies change
  useEffect(() => {
    // Only reset if timeout is already active
    if (timeoutRef.current) {
      stop();
      start();
    }
  }, dependencies);
  
  // Start the timeout
  const start = useCallback(() => {
    // Clear existing timeout if any
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Create new timeout
    timeoutRef.current = setTimeout(() => {
      callbackRef.current();
      timeoutRef.current = null;
    }, duration);
  }, [duration]);
  
  // Stop the timeout
  const stop = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);
  
  // Reset the timeout (stop and start)
  const reset = useCallback(() => {
    stop();
    start();
  }, [stop, start]);
  
  // Check if timeout is currently active
  const isActive = useCallback(() => {
    return timeoutRef.current !== null;
  }, []);
  
  return { start, stop, reset, isActive };
};

/**
 * Hook for creating a delayed action that automatically cleans up
 * 
 * @param callback Function to execute after delay
 * @param delay Delay in milliseconds
 * @returns Function that when called will execute callback after delay
 */
export const useDebounce = (
  callback: (...args: any[]) => void,
  delay: number = 500
) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  // Return debounced function
  return useCallback((...args: any[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
      timeoutRef.current = null;
    }, delay);
  }, [callback, delay]);
};

/**
 * Hook for executing a callback at regular intervals with auto cleanup
 * 
 * @param callback Function to execute at regular intervals
 * @param delay Delay between executions in milliseconds
 * @param immediate Whether to execute callback immediately on start
 * @returns Object with start, stop, and isActive methods
 */
export const useInterval = (
  callback: () => void,
  delay: number = 1000,
  immediate: boolean = false
) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);
  
  // Update the callback ref when it changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  // Clear interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
  
  // Start the interval
  const start = useCallback(() => {
    // Clear existing interval if any
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Execute immediately if requested
    if (immediate) {
      callbackRef.current();
    }
    
    // Create new interval
    intervalRef.current = setInterval(() => {
      callbackRef.current();
    }, delay);
  }, [delay, immediate]);
  
  // Stop the interval
  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);
  
  // Check if interval is currently active
  const isActive = useCallback(() => {
    return intervalRef.current !== null;
  }, []);
  
  return { start, stop, isActive };
};
