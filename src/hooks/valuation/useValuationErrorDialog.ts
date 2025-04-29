
/**
 * Hook for managing valuation error dialog state
 * Created: 2025-05-10
 */

import { useState, useCallback } from "react";

export function useValuationErrorDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [errorType, setErrorType] = useState<"vin" | "data" | "price" | "general">("general");
  const [errorMessage, setErrorMessage] = useState("");
  
  const showError = useCallback((message: string, type: "vin" | "data" | "price" | "general" = "general") => {
    setErrorMessage(message);
    setErrorType(type);
    setIsOpen(true);
  }, []);
  
  return {
    isOpen,
    setIsOpen,
    errorType,
    setErrorType,
    errorMessage, 
    setErrorMessage,
    showError
  };
}
