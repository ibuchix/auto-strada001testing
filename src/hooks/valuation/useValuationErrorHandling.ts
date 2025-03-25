
/**
 * Changes made:
 * - 2024-12-20: Created valuation error handling hook extracted from useValuationForm
 */

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { cleanupValuationData } from "@/components/hero/valuation/services/valuationService";

/**
 * Hook for handling valuation error scenarios and recovery
 */
export const useValuationErrorHandling = () => {
  const [retryCount, setRetryCount] = useState(0);

  const handleError = useCallback((error: any) => {
    // Increment retry count
    setRetryCount(prev => prev + 1);
    
    // After 3 retries, offer manual valuation option
    if (retryCount >= 2) {
      toast.error("Valuation service unavailable", {
        description: "We're having trouble connecting to our valuation service. Would you like to try manual valuation?",
        action: {
          label: "Try Manual",
          onClick: () => {
            cleanupValuationData();
            window.location.href = '/manual-valuation';
          }
        }
      });
    }
    
    return retryCount;
  }, [retryCount]);

  const resetRetryCount = useCallback(() => {
    setRetryCount(0);
  }, []);

  return {
    retryCount,
    handleError,
    resetRetryCount
  };
};
