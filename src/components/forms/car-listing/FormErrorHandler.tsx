
/**
 * Changes made:
 * - 2024-09-05: Extracted from CarListingForm.tsx to separate component
 * - 2025-11-02: Enhanced with draft error handling capabilities
 * - 2025-11-03: Added retry functionality with loading state indicator
 * - 2025-12-01: Updated to use the new error architecture
 */

import { ErrorHandler } from "./submission/ErrorHandler";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { BaseApplicationError, AuthenticationError } from "@/errors/classes";

interface FormErrorHandlerProps {
  error?: string | Error | BaseApplicationError | null;
  draftError?: Error | BaseApplicationError | null;
  onRetry?: () => void;
}

export const FormErrorHandler = ({ 
  error = "Please sign in to create a listing. Your progress will be saved.", 
  draftError,
  onRetry 
}: FormErrorHandlerProps) => {
  const [isRetrying, setIsRetrying] = useState(false);

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
    setTimeout(() => setIsRetrying(false), 2000);
  };
  
  // If there's a draft error, show a specialized error message
  if (draftError) {
    const errorMessage = getErrorMessage(draftError);
    const errorDescription = getErrorDescription(draftError) || "There was a problem loading your saved draft.";
    
    return (
      <Alert variant="destructive" className="mb-8">
        <AlertCircle className="h-5 w-5" />
        <AlertTitle>Failed to load draft</AlertTitle>
        <AlertDescription className="mt-2">
          <p className="mb-4">{errorMessage}</p>
          {onRetry && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRetry}
              disabled={isRetrying}
              className="flex items-center"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? 'Retrying...' : 'Try Again'}
            </Button>
          )}
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
    return <ErrorHandler error={error} />;
  } else if (error instanceof BaseApplicationError) {
    return <ErrorHandler 
      error={error.message} 
      description={error.description} 
      onRetry={error.recovery?.action} 
      actionLabel={error.recovery?.label}
    />;
  } else if (error instanceof Error) {
    return <ErrorHandler error={error.message} onRetry={onRetry} />;
  }
  
  return null;
};
