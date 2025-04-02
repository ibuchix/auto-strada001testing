
/**
 * Changes made:
 * - 2024-09-05: Extracted from CarListingForm.tsx to separate component
 * - 2025-11-02: Enhanced with draft error handling capabilities
 * - 2025-11-03: Added retry functionality with loading state indicator
 * - 2025-12-01: Updated to use the new error architecture
 * - 2024-08-15: Enhanced with consistent recovery paths and feedback patterns
 * - 2026-05-10: Improved error categorization and added offline detection
 */

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { BaseApplicationError, AuthenticationError } from "@/errors/classes";
import { ErrorHandler } from "./submission/ErrorHandler";
import { ErrorCategory, RecoveryType } from "@/errors/types";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";

interface FormErrorHandlerProps {
  error?: string | Error | BaseApplicationError | null;
  draftError?: Error | BaseApplicationError | null;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export const FormErrorHandler = ({ 
  error, 
  draftError,
  onRetry,
  onDismiss
}: FormErrorHandlerProps) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const { isOffline } = useOfflineStatus();
  const [isVisible, setIsVisible] = useState(true);

  // Reset visibility when error changes
  useEffect(() => {
    if (error || draftError) {
      setIsVisible(true);
    }
  }, [error, draftError]);
  
  if (!isVisible) {
    return null;
  }

  // Handle error object if it's a BaseApplicationError
  const getErrorMessage = (err: string | Error | BaseApplicationError | null): string => {
    if (err instanceof BaseApplicationError) {
      return err.message;
    } else if (err instanceof Error) {
      return err.message;
    }
    return err || "An unknown error occurred";
  };
  
  const getErrorDescription = (err: string | Error | BaseApplicationError | null): string | undefined => {
    if (err instanceof BaseApplicationError) {
      return err.description;
    }
    return undefined;
  };
  
  const handleRetry = () => {
    if (!onRetry) return;
    
    setIsRetrying(true);
    onRetry();
    // Reset loading state after a delay
    setTimeout(() => setIsRetrying(false), 2000);
  };
  
  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) {
      onDismiss();
    }
  };
  
  // Enhanced recovery options with clear labels
  const getRecoveryAction = (err: BaseApplicationError) => {
    if (err.recovery?.action) {
      return err.recovery.action;
    }
    return onRetry;
  };
  
  const getRecoveryLabel = (err: BaseApplicationError) => {
    if (err.recovery?.label) {
      return err.recovery.label;
    }
    
    // Generate appropriate label based on recovery type and category
    if (err.recovery?.type) {
      switch (err.recovery.type) {
        case RecoveryType.FIELD_CORRECTION:
          return 'Fix Error';
        case RecoveryType.FORM_RETRY:
          return 'Try Again';
        case RecoveryType.SIGN_IN:
          return 'Sign In';
        case RecoveryType.NAVIGATE:
          return 'Continue';
        case RecoveryType.REFRESH:
          return 'Refresh Page';
        case RecoveryType.CONTACT_SUPPORT:
          return 'Contact Support';
        default:
          return 'Try Again';
      }
    }
    
    return 'Try Again';
  };

  // Show offline error if we're offline
  if (isOffline) {
    return (
      <Alert variant="destructive" className="mb-8">
        <WifiOff className="h-5 w-5" />
        <AlertTitle>You are offline</AlertTitle>
        <AlertDescription className="mt-2">
          <p className="mb-4">Please check your internet connection and try again.</p>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.reload()}
              className="flex items-center"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Page
            </Button>
            {onDismiss && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleDismiss}
              >
                Dismiss
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }
  
  // If there's a draft error, show a specialized error message
  if (draftError) {
    const errorMessage = getErrorMessage(draftError);
    const errorDescription = getErrorDescription(draftError) || "There was a problem loading your saved draft.";
    
    // Apply recovery options if it's a BaseApplicationError
    const recoveryAction = draftError instanceof BaseApplicationError
      ? getRecoveryAction(draftError)
      : onRetry;
      
    const recoveryLabel = draftError instanceof BaseApplicationError
      ? getRecoveryLabel(draftError)
      : 'Try Again';
    
    return (
      <Alert variant="destructive" className="mb-8">
        <AlertCircle className="h-5 w-5" />
        <AlertTitle>Failed to load draft</AlertTitle>
        <AlertDescription className="mt-2">
          <p className="mb-4">{errorMessage}</p>
          <div className="flex space-x-2">
            {recoveryAction && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={recoveryAction === onRetry ? handleRetry : recoveryAction}
                disabled={isRetrying}
                className="flex items-center"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
                {isRetrying ? 'Retrying...' : recoveryLabel}
              </Button>
            )}
            {onDismiss && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleDismiss}
              >
                Dismiss
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Check if error is an auth error
  const isAuthError = error instanceof AuthenticationError || 
                     (typeof error === 'string' && 
                     (error.includes('sign in') || error.includes('authentication') || error.includes('session')));

  // For standard errors, use the ErrorHandler component
  if (typeof error === 'string') {
    return <ErrorHandler 
      error={error} 
      onRetry={onRetry}
      onDismiss={handleDismiss} 
    />;
  } else if (error instanceof BaseApplicationError) {
    return <ErrorHandler 
      error={error} 
      description={error.description} 
      onRetry={onRetry}
      onDismiss={handleDismiss}
      actionFn={error.recovery?.action} 
      actionLabel={error.recovery?.label}
    />;
  } else if (error instanceof Error) {
    return <ErrorHandler 
      error={error.message} 
      onRetry={onRetry}
      onDismiss={handleDismiss} 
    />;
  }
  
  return null;
};
