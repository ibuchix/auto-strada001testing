/**
 * Hook for handling application errors in React components
 * Created: 2025-12-01
 * Purpose: Provides a standardized way to handle errors in components
 * Updated: 2024-08-16: Integrated with centralized error context
 * Updated: 2026-05-10: Enhanced error categorization and improved recovery options
 * Updated: 2025-04-06: Fixed read-only property issues and type assignments
 * Updated: 2025-04-07: Fixed captureError method usage
 */

import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  AppError,
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
import { ErrorCategory, ErrorCode, RecoveryType } from '../errors/types';
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
  const [error, setError] = useState<AppError | null>(null);
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
      let appError: AppError;
      if (errorToHandle instanceof AppError) {
        appError = errorToHandle;
      } else {
        appError = new AppError({
          code: ErrorCode.UNKNOWN_ERROR,
          message: errorToHandle instanceof Error ? errorToHandle.message : 'An unknown error occurred',
          category: ErrorCategory.UNKNOWN,
          retryable: true
        });
      }
      
      // Create a new error with enhanced recovery options based on error count
      let enhancedError = appError;
      if (errorCount > 2 && appError.retryable) {
        // After multiple retries, suggest more drastic recovery options
        if (!appError.recovery || appError.recovery.type === RecoveryType.FORM_RETRY) {
          if (appError.category === ErrorCategory.NETWORK) {
            enhancedError = appError.withRecovery({
              type: RecoveryType.REFRESH,
              label: 'Refresh Page',
              action: RecoveryType.REFRESH,
              handler: () => window.location.reload()
            });
          } else if (appError.category === ErrorCategory.VALIDATION) {
            // For validation errors, create a new error with updated description
            enhancedError = appError.withDescription(
              `${appError.description || ''} Try checking all required fields.`
            );
          } else {
            enhancedError = appError.withRecovery({
              type: RecoveryType.CONTACT_SUPPORT,
              label: 'Contact Support',
              action: RecoveryType.CONTACT_SUPPORT,
              handler: () => {
                window.location.href = 'mailto:support@autostrada.com?subject=Error%20in%20application';
              }
            });
          }
        }
      }
      
      // Capture in the global error context if enabled
      if (captureInContext && errorContext) {
        errorContext.captureError(enhancedError);
      }
      
      // Log error if enabled
      if (logErrors) {
        logError(enhancedError);
      }
      
      // Store in state if enabled
      if (captureInState) {
        setError(enhancedError);
        
        // For field validation errors, also update fieldErrors state
        if (enhancedError instanceof ValidationError && enhancedError.metadata?.field) {
          setFieldErrors(prev => ({
            ...prev,
            [enhancedError.metadata.field]: enhancedError.message
          }));
        }
      }
      
      // Show toast if enabled
      if (showToast) {
        if (enhancedError.recovery) {
          toast.error(enhancedError.message, {
            description: enhancedError.description,
            duration: toastDuration,
            action: {
              label: enhancedError.recovery.label,
              onClick: enhancedError.recovery.handler
            }
          });
        } else {
          toast.error(enhancedError.message, {
            description: enhancedError.description,
            duration: toastDuration
          });
        }
      }
      
      // Handle field focus if it's a field error and focus is enabled
      if (focusOnErrors && 
          enhancedError instanceof ValidationError && 
          enhancedError.metadata?.field && 
          enhancedError.recovery?.type === RecoveryType.FIELD_CORRECTION) {
        const element = document.getElementById(enhancedError.metadata.field as string);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
          setTimeout(() => element.focus(), 100);
        }
      }
      
      return enhancedError;
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
