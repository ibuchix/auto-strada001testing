
/**
 * Changes made:
 * - 2024-12-20: Created valuation state management hook extracted from useValuationForm
 */

import { useState } from "react";
import { UseValuationStateProps } from "./types";

/**
 * Hook for managing valuation UI state
 */
export const useValuationState = (props?: UseValuationStateProps) => {
  const { initialState = {} } = props || {};
  const [isLoading, setIsLoading] = useState(initialState.isLoading || false);
  const [showDialog, setShowDialog] = useState(initialState.showDialog || false);
  const [valuationResult, setValuationResult] = useState(initialState.valuationResult || null);
  const [retryCount, setRetryCount] = useState(0);

  const incrementRetryCount = () => setRetryCount(prev => prev + 1);
  const resetRetryCount = () => setRetryCount(0);
  
  const resetState = () => {
    setValuationResult(null);
    setShowDialog(false);
    setIsLoading(false);
    resetRetryCount();
  };

  return {
    isLoading,
    setIsLoading,
    showDialog,
    setShowDialog,
    valuationResult,
    setValuationResult,
    retryCount,
    incrementRetryCount,
    resetRetryCount,
    resetState
  };
};
