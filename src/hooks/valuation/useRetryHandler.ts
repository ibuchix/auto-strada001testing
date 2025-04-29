
/**
 * Retry handler hook for valuation operations
 * Created: 2025-05-10
 */

import { useState, useCallback } from "react";
import { toast } from "sonner";

const MAX_RETRIES = 3;

export function useRetryHandler() {
  const [retryCount, setRetryCount] = useState(0);

  const handleRetry = useCallback(async (operation: () => Promise<void>) => {
    if (retryCount >= MAX_RETRIES) {
      toast.error("Maximum retry attempts reached", {
        description: "Please try again later or use manual valuation."
      });
      return false;
    }

    try {
      setRetryCount(prev => prev + 1);
      await operation();
      return true;
    } catch (error) {
      console.error("Retry failed:", error);
      toast.error("Retry attempt failed", {
        description: "Please try again or use manual valuation."
      });
      return false;
    }
  }, [retryCount]);

  const resetRetry = useCallback(() => {
    setRetryCount(0);
  }, []);

  return {
    retryCount,
    handleRetry,
    resetRetry,
    hasReachedMaxRetries: retryCount >= MAX_RETRIES
  };
}
