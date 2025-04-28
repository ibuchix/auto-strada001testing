
/**
 * Valuation state management hook
 * Created: 2025-05-10
 */

import { useState } from "react";
import { UseValuationStateResult } from "./types";

export function useValuationState(): UseValuationStateResult {
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [valuationResult, setValuationResult] = useState<any>(null);

  const resetState = () => {
    setIsLoading(false);
    setDialogOpen(false);
    setValuationResult(null);
  };

  return {
    isLoading,
    setIsLoading,
    dialogOpen,
    setDialogOpen,
    valuationResult,
    setValuationResult,
    resetState
  };
}
