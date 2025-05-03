/**
 * Error handling hook for component-level error management
 * Created: 2025-04-05
 */

import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AppError, ValidationError } from './classes';
import { createErrorFromUnknown } from './factory';
import { RecoveryAction } from './types';
import { useErrorContext } from './context';

interface UseErrorOptions {
  captureInContext?: boolean;
  showToast?: boolean;
  autoResetOnUnmount?: boolean;
}

export function useError(options: UseErrorOptions = {}) {
  const {
    captureInContext = true,
    showToast = true,
    autoResetOnUnmount = true
  } = options;
  
  const [error, setError] = useState<AppError | null>(null);
  const [isHandling, setIsHandling] = useState(false);
  const errorContext = useErrorContext();
  const navigate = useNavigate();
  
  // Reset on unmount if enabled
  useEffect(() => {
    return () => {
      if (autoResetOnUnmount) {
        setError(null);
      }
    };
  }, [autoResetOnUnmount]);
  
  const handleError = useCallback((errorData: unknown): AppError => {
    setIsHandling(true);
    
    try {
      // Convert to our error type
      const appError = createErrorFromUnknown(errorData);
      
      // Set local error state
      setError(appError);
      
      // Capture in context if enabled
      if (captureInContext) {
        errorContext.captureError(appError);
      } 
      // Show toast directly if not capturing in context (which already shows toast)
      else if (showToast) {
        const toastOptions: any = {
          description: appError.message
        };
        
        // Add action button if recovery is available
        if (appError.recovery) {
          toastOptions.action = {
            label: appError.recovery.label,
            onClick: () => {
              if (appError.recovery?.handler) {
                appError.recovery.handler();
              } else if (appError.recovery?.action === RecoveryAction.NAVIGATE && appError.recovery.route) {
                navigate(appError.recovery.route);
              }
            }
          };
        }
        
        toast.error(getErrorTitle(appError), toastOptions);
      }
      
      return appError;
    } finally {
      setIsHandling(false);
    }
  }, [captureInContext, errorContext, navigate, showToast]);
  
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  const executeWithErrorHandling = useCallback(async <T,>(
    fn: () => Promise<T>,
  ): Promise<T | null> => {
    try {
      clearError();
      return await fn();
    } catch (error) {
      handleError(error);
      return null;
    }
  }, [clearError, handleError]);
  
  const hasErrorOfType = useCallback((errorType: any): boolean => {
    return !!error && error instanceof errorType;
  }, [error]);

  return {
    error,
    hasError: !!error,
    isValidationError: hasErrorOfType(ValidationError),
    clearError,
    handleError,
    executeWithErrorHandling,
    isHandling
  };
}

// Helper function to get a user-friendly error title
function getErrorTitle(error: AppError): string {
  switch (error.category) {
    case 'validation':
      return 'Validation Error';
    case 'network':
      return 'Network Error';
    case 'authentication':
      return 'Authentication Required';
    case 'authorization':
      return 'Access Denied';
    case 'server':
      return 'Server Error';
    case 'business':
      if (error.code === 'valuation_error') {
        return 'Valuation Error';
      }
      return 'Operation Failed';
    default:
      return 'Error';
  }
}

// Helper for valuation errors
const handleValuationError = (error: unknown): AppError => {
  if (error instanceof AppError && error.code === ErrorCode.VALUATION_ERROR) {
    return error;
  }
  
  if (error instanceof Error) {
    const valuationError = new ValuationError(error.message);
    valuationError.stack = error.stack;
    return valuationError;
  }
  
  return new ValuationError('An unknown error occurred while getting your valuation.');
};
