
/**
 * ErrorContext.tsx
 * 
 * Context for application-wide error handling
 * Updated: 2025-04-06 - Fixed read-only property issues and type assignments
 * Updated: 2025-04-07 - Added captureError method and fixed type issues
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { AppError } from '@/errors/classes';
import { ErrorCode, ErrorCategory, RecoveryAction } from '@/errors/types';
import { toast } from 'sonner';
import { createErrorFromUnknown } from '@/errors/factory';

interface ErrorContextValue {
  errors: AppError[];
  addError: (error: AppError) => void;
  clearErrors: () => void;
  clearError: (id: string) => void;
  captureError: (error: unknown) => AppError;
}

const ErrorContext = createContext<ErrorContextValue | null>(null);

export const useErrorContext = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useErrorContext must be used within an ErrorProvider');
  }
  return context;
};

interface ErrorProviderProps {
  children: React.ReactNode;
}

export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
  const [errors, setErrors] = useState<AppError[]>([]);

  const addError = useCallback((error: AppError) => {
    setErrors(prev => [error, ...prev]);
    
    // Optionally show a toast for each error
    if (error.message) {
      const toastOptions: any = {
        description: error.description
      };
      
      if (error.recovery && error.recovery.handler) {
        toastOptions.action = {
          label: error.recovery.label,
          onClick: error.recovery.handler
        };
      }
      
      toast.error(error.message, toastOptions);
    }
  }, []);

  const captureError = useCallback((errorData: unknown): AppError => {
    // Convert to AppError if it's not already
    let error: AppError;
    
    if (errorData instanceof AppError) {
      error = errorData;
    } else if (errorData instanceof Error) {
      // Create a new AppError with the Error's properties
      error = new AppError({
        message: errorData.message,
        code: ErrorCode.UNKNOWN_ERROR,
        category: ErrorCategory.UNKNOWN,
        metadata: {
          originalError: errorData,
          details: { stack: errorData.stack }
        }
      });
    } else {
      // Create a generic error for anything else
      error = new AppError({
        message: String(errorData || 'Unknown error'),
        code: ErrorCode.UNKNOWN_ERROR,
        category: ErrorCategory.UNKNOWN
      });
    }
    
    // Generate a unique ID for this error instance if it doesn't have one
    const errorWithId = error.id ? error : new AppError({
      ...error.serialize(),
      id: crypto.randomUUID()
    });
    
    // Add the error to our state
    addError(errorWithId);
    
    return errorWithId;
  }, [addError]);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const clearError = useCallback((id: string) => {
    setErrors(prev => prev.filter(error => error.id !== id));
  }, []);

  return (
    <ErrorContext.Provider
      value={{
        errors,
        addError,
        clearErrors,
        clearError,
        captureError
      }}
    >
      {children}
    </ErrorContext.Provider>
  );
};
