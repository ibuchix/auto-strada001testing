
/**
 * Hook for accessing error state from the central store
 * Created: 2025-04-09
 */

import { useStore } from '@/store';
import { useCallback } from 'react';
import { toast } from 'sonner';
import { AppError } from '@/errors/classes';

export const useErrorStore = () => {
  const {
    errors: { errors, lastError },
    addError,
    clearErrors,
    clearError,
    captureError,
  } = useStore();

  // Enhanced error handling with toast integration
  const handleError = useCallback((error: unknown) => {
    // Skip handling if it's deliberately suppressed
    if (error === null || error === undefined) {
      return null;
    }

    try {
      // Convert to standard application error and capture in store
      const appError = captureError(error);
      
      // Show toast notification
      if (appError.message) {
        const toastOptions: any = {
          description: appError.description
        };
        
        if (appError.recovery && appError.recovery.handler) {
          toastOptions.action = {
            label: appError.recovery.label,
            onClick: appError.recovery.handler
          };
        }
        
        toast.error(appError.message, toastOptions);
      }
      
      return appError;
    } catch (handlerError) {
      console.error('Error in error handler:', handlerError);
      
      // Fallback error handling
      toast.error('An error occurred');
      return null;
    }
  }, [captureError]);

  return {
    // State
    errors,
    lastError,
    hasErrors: errors.length > 0,
    
    // Actions
    addError,
    clearErrors,
    clearError,
    captureError,
    handleError
  };
};
