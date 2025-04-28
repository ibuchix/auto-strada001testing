
/**
 * Valuation error handling hook
 * Created: 2025-05-10
 */

import { useState, useCallback } from "react";
import { toast } from "sonner";

export function useValuationErrorHandling() {
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);

  const handleError = useCallback((errorMessage: string) => {
    setLastError(errorMessage);
    
    if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
      toast.error("Too many requests", {
        description: "Please wait a moment before trying again.",
      });
    } else if (errorMessage.includes('timeout') || errorMessage === 'Request timed out') {
      toast.error("Valuation request timed out", {
        description: "The service took too long to respond. Please try again.",
      });
    } else {
      toast.error("Valuation failed", {
        description: errorMessage || "Failed to get vehicle valuation. Please try again.",
      });
    }
  }, []);

  const resetRetryCount = useCallback(() => {
    setRetryCount(0);
    setLastError(null);
  }, []);

  const incrementRetryCount = useCallback(() => {
    setRetryCount(prev => prev + 1);
  }, []);

  return {
    retryCount,
    lastError,
    handleError,
    resetRetryCount,
    incrementRetryCount,
    hasReachedMaxRetries: retryCount >= 3
  };
}
