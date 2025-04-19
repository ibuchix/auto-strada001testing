
/**
 * Hook for handling valuation error dialog state
 * Created: 2025-04-19
 */

import { useState, useCallback } from "react";

export const useValuationErrorDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleClose = useCallback(() => {
    console.log('Closing error dialog');
    setIsOpen(false);
  }, []);
  
  const handleRetry = useCallback(() => {
    console.log('Retry action from error dialog');
    setIsOpen(false);
  }, []);
  
  return {
    isOpen,
    setIsOpen,
    handleClose,
    handleRetry
  };
};
