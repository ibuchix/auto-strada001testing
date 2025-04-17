
/**
 * Hook for managing retry attempts and timing in valuation error handling
 * Created: 2025-04-17
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface RetryOptions {
  maxRetries?: number;
  minRetryDelay?: number;
}

export const useRetryHandler = (options: RetryOptions = {}) => {
  const { maxRetries = 3, minRetryDelay = 2000 } = options;
  const [retryCount, setRetryCount] = useState(0);
  const [lastRetryTime, setLastRetryTime] = useState<number | null>(null);

  useEffect(() => {
    // Load retry count from session storage
    const storedCount = Number(sessionStorage.getItem('valuationRetryCount') || '0');
    setRetryCount(storedCount);
    
    const storedTime = sessionStorage.getItem('valuationLastRetryTime');
    setLastRetryTime(storedTime ? Number(storedTime) : null);
    
    // Reset if it's been more than 5 minutes
    if (storedTime && Date.now() - Number(storedTime) > 5 * 60 * 1000) {
      sessionStorage.removeItem('valuationRetryCount');
      sessionStorage.removeItem('valuationLastRetryTime');
      setRetryCount(0);
      setLastRetryTime(null);
    }
  }, []);

  const handleRetry = async (retryFn: () => Promise<void>) => {
    if (retryCount >= maxRetries) {
      toast.error('Maximum retry attempts reached');
      return false;
    }

    const now = Date.now();
    if (lastRetryTime && now - lastRetryTime < minRetryDelay) {
      toast.info('Please wait before retrying');
      return false;
    }

    const newCount = retryCount + 1;
    setRetryCount(newCount);
    setLastRetryTime(now);
    
    sessionStorage.setItem('valuationRetryCount', newCount.toString());
    sessionStorage.setItem('valuationLastRetryTime', now.toString());

    try {
      await retryFn();
      return true;
    } catch (error) {
      console.error('Retry attempt failed:', error);
      return false;
    }
  };

  const resetRetry = () => {
    setRetryCount(0);
    setLastRetryTime(null);
    sessionStorage.removeItem('valuationRetryCount');
    sessionStorage.removeItem('valuationLastRetryTime');
  };

  return {
    retryCount,
    handleRetry,
    resetRetry,
    hasReachedMaxRetries: retryCount >= maxRetries
  };
};
