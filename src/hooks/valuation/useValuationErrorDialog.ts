
/**
 * Hook for handling valuation error dialog state
 * Created: 2025-04-17
 * 
 * This hook provides state management for valuation error dialogs,
 * including open/close functionality and retry capabilities.
 */

import { useState, useCallback } from "react";

export const useValuationErrorDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const handleClose = useCallback(() => {
    console.log('Closing error dialog');
    setIsOpen(false);
  }, []);
  
  const handleRetry = useCallback(() => {
    console.log('Retry action from error dialog');
    setIsOpen(false);
  }, []);
  
  const showError = useCallback((message: string) => {
    setErrorMessage(message);
    setIsOpen(true);
  }, []);
  
  return {
    isOpen,
    errorMessage,
    setIsOpen,
    showError,
    handleClose,
    handleRetry
  };
};
