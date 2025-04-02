/**
 * Hook for handling application errors in React components
 * Created: 2025-12-01
 * Purpose: Provides a standardized way to handle errors in components
 * Updated: 2024-08-16: Integrated with centralized error context
 * Updated: 2026-05-10: Enhanced error categorization and improved recovery options
 */

import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  BaseApplicationError,
  ValidationError,
  SubmissionError,
  AuthenticationError
} from '../errors/classes';
import { 
  handleAppError,
  createFieldError,
  createFormError,
  createNetworkError,
  createAuthError,
  createSubmissionError,
  createTimeoutError
} from '../errors/factory';
import { ErrorCategory, RecoveryType } from '../errors/types';
import { useErrorContext } from '@/contexts/ErrorContext';
import { logError } from '@/utils/errorLogger';

interface ErrorHandlingOptions {
  showToast?: boolean;
  focusOnErrors?: boolean;
  logErrors?: boolean;
  captureInState?: boolean;
  captureInContext?: boolean;
  toastDuration?: number;
}

/**
 * Hook for standardized error handling in components
 */
export function useErrorHandling(options: ErrorHandlingOptions = {}) {
  const {
    showToast = true,
    focusOnErrors = true,
    logErrors = true,
    captureInState = true,
    captureInContext = true,
    toastDuration = 5000
  } = options;
  
  const errorContext = useErrorContext();
  const navigate = useNavigate();
  const [error, setError] = useState<BaseApplicationError | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [errorCount, setErrorCount] = useState(0);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      setError(null);
      setFieldErrors({});
      setErrorCount(0);
    };
  }, []);
  
  /**
   * Clear all errors
   */
  const clearErrors = useCallback(() => {
    setError(null);
    setFieldErrors({});
  }, []);
  
  /**
   * Handle an error with consistent behavior
   */
  const handleError = useCallback((errorToHandle: unknown) => {
    // Skip handling if it's a deliberately suppressed error
    if (errorToHandle === null || errorToHandle === undefined) {
      return null;
    }
    
    try {
      // Track error count for retry logic
      setErrorCount(prevCount => prevCount + 1);

      // Convert to standard application error format
      const appError = errorToHandle instanceof BaseApplicationError
        ? errorToHandle
        : new BaseApplicationError({
            code: 'UNKNOWN_ERROR',
            message: errorToHandle instanceof Error ? errorToHandle.message : 'An unknown error occurred',
            category: ErrorCategory.UNKNOWN,
            retryable: true
          });
      
      // Enhance error with better recovery options based on error count
      if (errorCount > 2 && appError.retryable) {
        // After multiple retries, suggest more drastic recovery options
        if (!appError.recovery || appError.recovery.type === RecoveryType.FORM_RETRY) {
          switch (appError.category) {
            case ErrorCategory.NETWORK:
              appError.recovery = {
                type: RecoveryType.REFRESH,
                label: 'Refresh Page',
                action: () => window.location.reload()
              };
              break;
            case ErrorCategory.VALIDATION:
              // Keep validation as is, but add description
              appError.description = `${appError.description || ''} Try checking all required fields.`;
              break;
            default:
              appError.recovery = {
                type: RecoveryType.CONTACT_SUPPORT,
                label: 'Contact Support',
                action: () => {
                  window.location.href = 'mailto:support@autostrada.com?subject=Error%20in%20application';
                }
              };
          }
        }
      }
      
      // Capture in the global error context if enabled
      if (captureInContext && errorContext) {
        errorContext.captureError(appError);
      }
      
      // Log error if enabled
      if (logErrors) {
        logError(appError);
      }
      
      // Store in state if enabled
      if (captureInState) {
        setError(appError);
        
        // For field validation errors, also update fieldErrors state
        if (appError instanceof ValidationError && appError.metadata?.field) {
          setFieldErrors(prev => ({
            ...prev,
            [appError.metadata.field]: appError.message
          }));
        }
      }
      
      // Show toast if enabled
      if (showToast) {
        if (appError.recovery) {
          toast.error(appError.message, {
            description: appError.description,
            duration: toastDuration,
            action: {
              label: appError.recovery.label,
              onClick: appError.recovery.action
            }
          });
        } else {
          toast.error(appError.message, {
            description: appError.description,
            duration: toastDuration
          });
        }
      }
      
      // Handle field focus if it's a field error and focus is enabled
      if (focusOnErrors && 
          appError instanceof ValidationError && 
          appError.metadata?.field && 
          appError.recovery?.type === RecoveryType.FIELD_CORRECTION) {
        const element = document.getElementById(appError.metadata.field as string);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
          setTimeout(() => element.focus(), 100);
        }
      }
      
      return appError;
    } catch (handlerError) {
      console.error('Error in error handler:', handlerError);
      
      // Fallback error handling
      if (showToast) {
        toast.error('An error occurred');
      }
      
      return null;
    }
  }, [showToast, focusOnErrors, logErrors, captureInState, captureInContext, errorContext, errorCount, toastDuration]);
  
  /**
   * Create common type of errors with preset handling
   */
  const createErrors = useCallback(() => ({
    fieldError: (field: string, message: string, options = {}) => 
      createFieldError(field, message, { focus: focusOnErrors, ...options }),
      
    formError: (message: string, options = {}) => 
      createFormError(message, options),
      
    networkError: (message: string, options = {}) => 
      createNetworkError(message, options),
      
    authError: (message: string, options = {}) => 
      createAuthError(message, options),
      
    submissionError: (message: string, options = {}) => 
      createSubmissionError(message, options),
      
    timeoutError: (message: string, options = {}) => 
      createTimeoutError(message, options)
  }), [focusOnErrors]);
  
  /**
   * Check if there's a specific type of error
   */
  const hasErrorOfType = useCallback((errorType: Function) => {
    return error instanceof errorType;
  }, [error]);
  
  /**
   * Get field-specific error message
   */
  const getFieldError = useCallback((fieldName: string): string | undefined => {
    return fieldErrors[fieldName];
  }, [fieldErrors]);
  
  /**
   * Check if a field has an error
   */
  const hasFieldError = useCallback((fieldName: string): boolean => {
    return !!fieldErrors[fieldName];
  }, [fieldErrors]);
  
  /**
   * Clear error for a specific field
   */
  const clearFieldError = useCallback((fieldName: string) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);
  
  /**
   * Wrap an async function with error handling
   */
  const withErrorHandling = useCallback(async <T,>(
    fn: () => Promise<T>,
    errorHandler?: (error: unknown) => void
  ): Promise<T | null> => {
    try {
      clearErrors();
      return await fn();
    } catch (e) {
      const handledError = handleError(e);
      if (errorHandler) {
        errorHandler(handledError);
      }
      return null;
    }
  }, [handleError, clearErrors]);
  
  /**
   * Reset error count
   */
  const resetErrorCount = useCallback(() => {
    setErrorCount(0);
  }, []);
  
  return {
    error,
    fieldErrors,
    errorCount,
    hasError: !!error,
    handleError,
    clearErrors,
    clearFieldError,
    hasErrorOfType,
    withErrorHandling,
    getFieldError,
    hasFieldError,
    resetErrorCount,
    createError: createErrors()
  };
}
