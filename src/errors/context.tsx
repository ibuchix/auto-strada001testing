
/**
 * ErrorContext.tsx
 * 
 * Context for application-wide error handling
 * Updated: 2025-04-06 - Fixed read-only property issues and type assignments
 * Updated: 2025-04-07 - Added captureError method and fixed type issues
 * Updated: 2025-04-09 - Refactored to use centralized store
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useErrorStore } from '@/hooks/store/useErrorStore';
import { AppError } from '@/errors/classes';
import { ErrorInfo } from 'react';

interface ErrorContextValue {
  errors: AppError[];
  addError: (error: AppError) => void;
  clearErrors: () => void;
  clearError: (id: string) => void;
  captureError: (error: unknown) => AppError;
  handleComponentError: (error: Error, errorInfo: ErrorInfo) => void;
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
  children: ReactNode;
}

export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
  // Use our new store for error management
  const {
    errors,
    addError,
    clearErrors,
    clearError,
    captureError,
    handleError
  } = useErrorStore();

  // Handler for React component errors
  const handleComponentError = useCallback((error: Error, errorInfo: ErrorInfo) => {
    console.error('Component error caught:', error, errorInfo);
    const appError = captureError(error);
    
    // Log error info separately (not included in AppError)
    console.error('Component stack:', errorInfo.componentStack);
    
    return appError;
  }, [captureError]);

  // Create context value from store
  const contextValue: ErrorContextValue = {
    errors,
    addError,
    clearErrors,
    clearError,
    captureError,
    handleComponentError
  };

  return (
    <ErrorContext.Provider value={contextValue}>
      {children}
    </ErrorContext.Provider>
  );
};
