
/**
 * General Error Handler Component
 * Created 2028-05-15: Provides consistent error handling UI
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import { ErrorCategory } from "@/errors/types";

interface GeneralErrorHandlerProps {
  error: Error | unknown;
  resetError?: () => void;
  fallbackUI?: React.ReactNode;
}

export const GeneralErrorHandler = ({
  error,
  resetError,
  fallbackUI
}: GeneralErrorHandlerProps) => {
  const navigate = useNavigate();
  
  // Normalize the error object
  const errorMessage = error instanceof Error 
    ? error.message 
    : typeof error === 'string' 
      ? error 
      : 'An unknown error occurred';
  
  // Detect error category
  const errorCategory = determineErrorCategory(error);
  
  // Handle different error types differently
  const handleErrorAction = () => {
    switch (errorCategory) {
      case ErrorCategory.AUTHENTICATION:
        navigate('/auth');
        break;
      case ErrorCategory.NETWORK:
        window.location.reload();
        break;
      case ErrorCategory.PERMISSION:
        navigate('/');
        break;
      default:
        if (resetError) resetError();
        break;
    }
  };
  
  // If there's custom fallback UI, use it
  if (fallbackUI) {
    return <>{fallbackUI}</>;
  }
  
  return (
    <div className="p-4 max-w-md mx-auto">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{errorMessage}</AlertDescription>
        <div className="mt-4 flex justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleErrorAction}
            className="flex items-center gap-2"
          >
            <RefreshCw size={14} />
            {getActionLabel(errorCategory)}
          </Button>
        </div>
      </Alert>
    </div>
  );
};

// Helper to determine error category from error object
function determineErrorCategory(error: unknown): ErrorCategory {
  if (error && typeof error === 'object') {
    if ('category' in error && typeof error.category === 'string') {
      // If the error already has a category property, use it
      return error.category as ErrorCategory;
    }
    
    if ('name' in error) {
      const errorName = String(error.name).toLowerCase();
      if (errorName.includes('auth') || errorName.includes('login')) {
        return ErrorCategory.AUTHENTICATION;
      }
      if (errorName.includes('network') || errorName.includes('connection')) {
        return ErrorCategory.NETWORK;
      }
      if (errorName.includes('permission') || errorName.includes('forbidden')) {
        return ErrorCategory.PERMISSION;
      }
      if (errorName.includes('validation')) {
        return ErrorCategory.VALIDATION;
      }
    }
    
    if ('message' in error) {
      const errorMsg = String(error.message).toLowerCase();
      if (errorMsg.includes('authentication') || 
          errorMsg.includes('login') || 
          errorMsg.includes('sign in')) {
        return ErrorCategory.AUTHENTICATION;
      }
      if (errorMsg.includes('network') || 
          errorMsg.includes('connection') || 
          errorMsg.includes('offline')) {
        return ErrorCategory.NETWORK;
      }
      if (errorMsg.includes('permission') || 
          errorMsg.includes('access') || 
          errorMsg.includes('denied')) {
        return ErrorCategory.PERMISSION;
      }
    }
  }
  
  return ErrorCategory.GENERAL;
}

// Get appropriate action label based on error category
function getActionLabel(category: ErrorCategory): string {
  switch (category) {
    case ErrorCategory.AUTHENTICATION:
      return 'Sign In';
    case ErrorCategory.NETWORK:
      return 'Reload';
    case ErrorCategory.PERMISSION:
      return 'Go Home';
    case ErrorCategory.VALIDATION:
      return 'Review';
    default:
      return 'Try Again';
  }
}
