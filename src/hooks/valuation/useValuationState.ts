
/**
 * Valuation state management hook
 * Created: 2025-05-10
 */

import { useState, useCallback } from "react";

export function useValuationState() {
  const [isLoading, setIsLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [valuationResult, setValuationResult] = useState<any>(null);
  const [retryCount, setRetryCount] = useState(0);

  const resetState = useCallback(() => {
    setIsLoading(false);
    setShowDialog(false);
    setValuationResult(null);
    setRetryCount(0);
  }, []);

  const incrementRetryCount = useCallback(() => {
    setRetryCount(prev => prev + 1);
  }, []);

  return {
    isLoading,
    setIsLoading,
    showDialog,
    setShowDialog,
    valuationResult,
    setValuationResult,
    retryCount,
    setRetryCount,
    incrementRetryCount,
    resetRetryCount: () => setRetryCount(0),
    resetState
  };
}
