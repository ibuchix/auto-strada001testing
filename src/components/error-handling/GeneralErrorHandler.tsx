
/**
 * General Error Handler Component
 * Created 2028-05-15: Provides consistent error handling UI
 * Updated 2028-05-18: Added support for category prop
 * Updated 2025-04-05: Fixed ErrorCategory references and TypeScript type issues
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { ErrorCategory } from "@/errors/types";
import { AppError } from "@/errors/classes";

interface GeneralErrorHandlerProps {
  error: Error | unknown;
  resetError?: () => void;
  fallbackUI?: React.ReactNode;
  category?: ErrorCategory;  // Added category prop
  title?: string;  // Added title prop
  description?: string;  // Added description prop
  primaryAction?: {  // Added primaryAction prop
    label: string;
    onClick: () => void;
  };
  onRetry?: () => void;  // Added onRetry prop
}

export const GeneralErrorHandler = ({
  error,
  resetError,
  fallbackUI,
  category: providedCategory,  // Use the category if provided
  title,
  description,
  primaryAction,
  onRetry
}: GeneralErrorHandlerProps) => {
  const navigate = useNavigate();
  
  // Normalize the error object
  const errorMessage = error instanceof Error 
    ? error.message 
    : typeof error === 'string' 
      ? error 
      : 'An unknown error occurred';
  
  // Detect error category - use provided category or determine from error
  const errorCategory = providedCategory || determineErrorCategory(error);
  
  // Handle different error types differently
  const handleErrorAction = () => {
    if (onRetry) {
      onRetry();
      return;
    }
    
    if (primaryAction) {
      primaryAction.onClick();
      return;
    }
    
    switch (errorCategory) {
      case ErrorCategory.AUTHENTICATION:
        navigate('/auth');
        break;
      case ErrorCategory.NETWORK:
        window.location.reload();
        break;
      case ErrorCategory.AUTHORIZATION:
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
        <AlertTitle>{title || "Error"}</AlertTitle>
        <AlertDescription>{description || errorMessage}</AlertDescription>
        <div className="mt-4 flex justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleErrorAction}
            className="flex items-center gap-2"
          >
            <RefreshCcw size={14} />
            {primaryAction?.label || getActionLabel(errorCategory)}
          </Button>
        </div>
      </Alert>
    </div>
  );
};

// Helper to determine error category from error object
function determineErrorCategory(error: unknown): ErrorCategory {
  if (error instanceof AppError) {
    return error.category;
  }
  
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
        return ErrorCategory.AUTHORIZATION;
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
        return ErrorCategory.AUTHORIZATION;
      }
    }
  }
  
  return ErrorCategory.UNKNOWN;
}

// Get appropriate action label based on error category
function getActionLabel(category: ErrorCategory): string {
  switch (category) {
    case ErrorCategory.AUTHENTICATION:
      return 'Sign In';
    case ErrorCategory.NETWORK:
      return 'Reload';
    case ErrorCategory.AUTHORIZATION:
      return 'Go Home';
    case ErrorCategory.VALIDATION:
      return 'Review';
    default:
      return 'Try Again';
  }
}
