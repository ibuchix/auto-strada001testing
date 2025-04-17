
/**
 * Hook for managing retry attempts and timing in valuation error handling
 * Created: 2025-04-17
 * Updated: 2025-04-17 - Enhanced with better retry strategy and performance tracking
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { trackValidationAttempt } from '@/utils/valuation/validationTracker';

interface RetryOptions {
  maxRetries?: number;
  minRetryDelay?: number;
  exponentialBackoff?: boolean;
  resetAfterMinutes?: number;
}

interface RetryState {
  retryCount: number;
  lastRetryTime: number | null;
  retrySuccess: boolean;
  retryAttempts: {
    timestamp: number;
    success: boolean;
  }[];
}

export const useRetryHandler = (options: RetryOptions = {}) => {
  const { 
    maxRetries = 3, 
    minRetryDelay = 2000,
    exponentialBackoff = true,
    resetAfterMinutes = 5
  } = options;
  
  const [retryState, setRetryState] = useState<RetryState>({
    retryCount: 0,
    lastRetryTime: null,
    retrySuccess: false,
    retryAttempts: []
  });

  useEffect(() => {
    // Load retry state from session storage
    try {
      const storedData = sessionStorage.getItem('valuationRetryState');
      if (storedData) {
        const parsedState = JSON.parse(storedData) as RetryState;
        
        // Check if we should reset based on time elapsed
        const now = Date.now();
        const shouldReset = !parsedState.lastRetryTime || 
                           (now - parsedState.lastRetryTime > resetAfterMinutes * 60 * 1000);
        
        if (shouldReset) {
          console.log('Resetting retry state due to time elapsed');
          resetRetry();
        } else {
          setRetryState(parsedState);
        }
      }
    } catch (error) {
      console.error('Error loading retry state:', error);
      // Reset on error
      resetRetry();
    }
  }, [resetAfterMinutes]);

  const handleRetry = async (retryFn: () => Promise<void>, vin?: string, mileage?: number) => {
    if (retryState.retryCount >= maxRetries) {
      toast.error('Maximum retry attempts reached');
      return false;
    }

    const now = Date.now();
    
    // Calculate current delay based on exponential backoff if enabled
    let currentDelay = minRetryDelay;
    if (exponentialBackoff && retryState.retryCount > 0) {
      currentDelay = minRetryDelay * Math.pow(2, retryState.retryCount);
    }
    
    if (retryState.lastRetryTime && now - retryState.lastRetryTime < currentDelay) {
      const waitTimeMs = currentDelay - (now - retryState.lastRetryTime);
      const waitTimeSec = Math.ceil(waitTimeMs / 1000);
      
      toast.info(`Please wait ${waitTimeSec} second${waitTimeSec !== 1 ? 's' : ''} before retrying`);
      return false;
    }

    const newCount = retryState.retryCount + 1;
    const startTime = performance.now();
    
    const newRetryState: RetryState = {
      ...retryState,
      retryCount: newCount,
      lastRetryTime: now
    };
    
    // Update state and persist to session storage
    setRetryState(newRetryState);
    try {
      sessionStorage.setItem('valuationRetryState', JSON.stringify(newRetryState));
    } catch (error) {
      console.error('Failed to store retry state:', error);
    }

    try {
      await retryFn();
      
      // Track successful attempt
      const endTime = performance.now();
      const processingTime = endTime - startTime;
      
      if (vin && mileage) {
        trackValidationAttempt(vin, mileage, true, processingTime);
      }
      
      // Update state with success
      const successState: RetryState = {
        ...newRetryState,
        retrySuccess: true,
        retryAttempts: [
          ...newRetryState.retryAttempts,
          { timestamp: now, success: true }
        ]
      };
      
      setRetryState(successState);
      try {
        sessionStorage.setItem('valuationRetryState', JSON.stringify(successState));
      } catch (error) {
        console.error('Failed to store retry success state:', error);
      }
      
      return true;
    } catch (error) {
      // Track failed attempt
      const endTime = performance.now();
      const processingTime = endTime - startTime;
      
      if (vin && mileage) {
        trackValidationAttempt(
          vin, 
          mileage, 
          false, 
          processingTime,
          error instanceof Error ? error.message : String(error)
        );
      }
      
      console.error('Retry attempt failed:', error);
      
      // Update state with failure
      const failureState: RetryState = {
        ...newRetryState,
        retryAttempts: [
          ...newRetryState.retryAttempts,
          { timestamp: now, success: false }
        ]
      };
      
      setRetryState(failureState);
      try {
        sessionStorage.setItem('valuationRetryState', JSON.stringify(failureState));
      } catch (error) {
        console.error('Failed to store retry failure state:', error);
      }
      
      return false;
    }
  };

  const resetRetry = () => {
    const initialState: RetryState = {
      retryCount: 0,
      lastRetryTime: null,
      retrySuccess: false,
      retryAttempts: []
    };
    
    setRetryState(initialState);
    try {
      sessionStorage.removeItem('valuationRetryState');
    } catch (error) {
      console.error('Failed to remove retry state from session storage:', error);
    }
  };

  return {
    retryCount: retryState.retryCount,
    retrySuccess: retryState.retrySuccess,
    handleRetry,
    resetRetry,
    hasReachedMaxRetries: retryState.retryCount >= maxRetries,
    retryAttempts: retryState.retryAttempts
  };
};
