/**
 * Changes made:
 * - 2024-08-25: Created generalized error handler component
 * - 2024-08-15: Enhanced with consistent recovery paths and feedback patterns
 */

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorCategory } from "@/utils/errorHandlers";
import { BaseApplicationError } from "@/errors/classes";

interface GeneralErrorHandlerProps {
  error?: string | Error | BaseApplicationError | null;
  category?: ErrorCategory;
  title?: string;
  description?: string;
  onRetry?: () => void;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * General error handler component for displaying various error types
 * with consistent recovery options
 */
export const GeneralErrorHandler = ({ 
  error,
  category = ErrorCategory.GENERAL,
  title,
  description,
  onRetry,
  primaryAction
}: GeneralErrorHandlerProps) => {
  if (!error) return null;

  // Extract message and description from various error types
  const errorMessage = typeof error === 'string' 
    ? error 
    : error instanceof BaseApplicationError 
      ? error.message
      : error instanceof Error
        ? error.message
        : 'An unknown error occurred';
  
  const errorDescription = typeof error !== 'string'
    ? (error instanceof BaseApplicationError 
        ? error.description 
        : description)
    : description;

  // Get primary action from error recovery if available
  const action = primaryAction || (
    error instanceof BaseApplicationError && error.recovery
      ? {
          label: error.recovery.label,
          onClick: error.recovery.action
        }
      : undefined
  );

  // Determine error title based on category if not provided
  const errorTitle = title || (() => {
    // If we have a BaseApplicationError, use its category
    if (error instanceof BaseApplicationError) {
      switch (error.category) {
        case ErrorCategory.AUTHENTICATION:
          return "Authentication Error";
        case ErrorCategory.PERMISSION:
          return "Permission Denied";
        case ErrorCategory.VALIDATION:
          return "Validation Error";
        case ErrorCategory.NETWORK:
          return "Network Error";
        case ErrorCategory.SUBMISSION:
          return "Submission Error";
        default:
          return "An Error Occurred";
      }
    }
    
    // Otherwise use the provided category
    switch (category) {
      case ErrorCategory.AUTHENTICATION:
        return "Authentication Error";
      case ErrorCategory.PERMISSION:
        return "Permission Denied";
      case ErrorCategory.VALIDATION:
        return "Validation Error";
      case ErrorCategory.NETWORK:
        return "Network Error";
      default:
        return "An Error Occurred";
    }
  })();

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <div className="flex flex-col space-y-2">
        <AlertTitle>{errorTitle}</AlertTitle>
        <AlertDescription>{errorDescription || errorMessage}</AlertDescription>
        <div className="flex space-x-2 mt-2">
          {action && (
            <Button 
              variant="default"
              size="sm"
              onClick={action.onClick}
              className="bg-[#DC143C] hover:bg-[#DC143C]/90 text-white"
            >
              {action.label}
            </Button>
          )}
          
          {onRetry && (!action || action.onClick !== onRetry) && (
            <Button 
              variant={action ? "outline" : "default"}
              size="sm"
              onClick={onRetry}
              className={action 
                ? "text-[#DC143C] border-[#DC143C] hover:bg-[#DC143C]/10" 
                : "bg-[#DC143C] hover:bg-[#DC143C]/90 text-white"}
            >
              Try Again
            </Button>
          )}
        </div>
      </div>
    </Alert>
  );
};
