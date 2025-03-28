
/**
 * Changes made:
 * - 2024-08-16: Created centralized error context for global error handling
 * - 2024-08-16: Implemented structured logging and recovery options
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { toast } from 'sonner';
import { BaseApplicationError } from '@/errors/classes';
import { ErrorCategory } from '@/errors/types';
import { handleAppError } from '@/errors/factory';

// Define interfaces for the context
interface ErrorContextType {
  lastError: BaseApplicationError | null;
  errors: BaseApplicationError[];
  captureError: (error: unknown) => BaseApplicationError | null;
  clearError: (id?: string) => void;
  clearAllErrors: () => void;
  hasActiveErrors: boolean;
}

interface ErrorProviderProps {
  children: ReactNode;
  enableLogging?: boolean;
  enableToasts?: boolean;
}

// Create the context
const ErrorContext = createContext<ErrorContextType | null>(null);

// Custom hook to use the error context
export const useErrorContext = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useErrorContext must be used within an ErrorProvider');
  }
  return context;
};

// Error Provider component
export const ErrorProvider: React.FC<ErrorProviderProps> = ({ 
  children, 
  enableLogging = true, 
  enableToasts = true 
}) => {
  const [errors, setErrors] = useState<BaseApplicationError[]>([]);
  const [lastError, setLastError] = useState<BaseApplicationError | null>(null);

  // Format error for structured logging
  const formatErrorForLogging = (error: BaseApplicationError): Record<string, any> => {
    return {
      timestamp: new Date().toISOString(),
      errorId: error.id || 'unknown',
      code: error.code,
      category: error.category,
      message: error.message,
      description: error.description,
      metadata: error.metadata,
      stackTrace: error.stack,
    };
  };

  // Structured logging function
  const logError = useCallback((error: BaseApplicationError) => {
    if (!enableLogging) return;
    
    const formattedError = formatErrorForLogging(error);
    
    // Log to console with structured format
    console.error(
      `[ERROR][${error.category}][${error.code}] ${error.message}`, 
      formattedError
    );
    
    // Here you could add external logging service integration
    // e.g., Sentry, LogRocket, etc.
  }, [enableLogging]);

  // Capture and process an error
  const captureError = useCallback((errorData: unknown): BaseApplicationError | null => {
    if (!errorData) return null;
    
    // Convert to BaseApplicationError if needed
    const error = errorData instanceof BaseApplicationError 
      ? errorData 
      : new BaseApplicationError({
          code: 'UNKNOWN_ERROR',
          message: errorData instanceof Error ? errorData.message : String(errorData),
          category: ErrorCategory.UNKNOWN,
        });
    
    // Generate unique ID if not present
    if (!error.id) {
      error.id = crypto.randomUUID();
    }
    
    // Add the error to our state
    setErrors(prev => [...prev, error]);
    setLastError(error);
    
    // Log the error
    logError(error);
    
    // Show toast notification if enabled
    if (enableToasts) {
      if (error.recovery) {
        toast.error(error.message, {
          description: error.description,
          action: {
            label: error.recovery.label,
            onClick: error.recovery.action
          }
        });
      } else {
        toast.error(error.message, {
          description: error.description
        });
      }
    }
    
    return error;
  }, [logError, enableToasts]);

  // Remove a specific error by ID
  const clearError = useCallback((id?: string) => {
    if (!id) {
      if (lastError) {
        setErrors(prev => prev.filter(error => error.id !== lastError.id));
        setLastError(null);
      }
      return;
    }
    
    setErrors(prev => prev.filter(error => error.id !== id));
    
    // If we're clearing the last error, reset it
    if (lastError?.id === id) {
      setLastError(null);
    }
  }, [lastError]);

  // Clear all errors
  const clearAllErrors = useCallback(() => {
    setErrors([]);
    setLastError(null);
  }, []);

  return (
    <ErrorContext.Provider
      value={{
        lastError,
        errors,
        captureError,
        clearError,
        clearAllErrors,
        hasActiveErrors: errors.length > 0
      }}
    >
      {children}
    </ErrorContext.Provider>
  );
};
