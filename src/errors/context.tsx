
/**
 * Error context for application-wide error management
 * Created: 2025-04-05
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AppError } from './classes';
import { createErrorFromUnknown } from './factory';
import { RecoveryAction } from './types';

interface ErrorContextType {
  errors: AppError[];
  lastError: AppError | null;
  clearErrors: () => void;
  clearError: (id: string) => void;
  captureError: (error: unknown) => AppError;
  hasErrors: boolean;
}

const ErrorContext = createContext<ErrorContextType | null>(null);

interface ErrorProviderProps {
  children: ReactNode;
  showToasts?: boolean;
}

export const ErrorProvider: React.FC<ErrorProviderProps> = ({ 
  children, 
  showToasts = true 
}) => {
  const [errors, setErrors] = useState<AppError[]>([]);
  const navigate = useNavigate();

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const clearError = useCallback((id: string) => {
    setErrors(prev => prev.filter(error => error.id !== id));
  }, []);

  const captureError = useCallback((errorData: unknown): AppError => {
    const error = createErrorFromUnknown(errorData);
    
    // Add to our errors list
    setErrors(prev => [error, ...prev]);
    
    // Show toast notification if enabled
    if (showToasts) {
      const toastOptions: any = {
        description: error.message
      };
      
      // Add action button if recovery is available
      if (error.recovery) {
        toastOptions.action = {
          label: error.recovery.label,
          onClick: () => {
            if (error.recovery?.handler) {
              error.recovery.handler();
            } else if (error.recovery?.action === RecoveryAction.NAVIGATE && error.recovery.route) {
              navigate(error.recovery.route);
            }
          }
        };
      }
      
      toast.error(getToastTitleFromError(error), toastOptions);
    }
    
    return error;
  }, [navigate, showToasts]);

  return (
    <ErrorContext.Provider
      value={{
        errors,
        lastError: errors.length > 0 ? errors[0] : null,
        clearErrors,
        clearError,
        captureError,
        hasErrors: errors.length > 0
      }}
    >
      {children}
    </ErrorContext.Provider>
  );
};

export const useErrorContext = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useErrorContext must be used within an ErrorProvider');
  }
  return context;
};

// Helper function to get a user-friendly toast title
function getToastTitleFromError(error: AppError): string {
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
