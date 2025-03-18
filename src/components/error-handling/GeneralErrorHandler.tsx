
/**
 * Changes made:
 * - 2024-08-25: Created generalized error handler component
 */

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorCategory } from "@/utils/errorHandlers";

interface GeneralErrorHandlerProps {
  error?: string | null;
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

  // Determine error title based on category if not provided
  const errorTitle = title || (() => {
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
        <AlertDescription>{description || error}</AlertDescription>
        <div className="flex space-x-2 mt-2">
          {primaryAction && (
            <Button 
              variant="default"
              size="sm"
              onClick={primaryAction.onClick}
              className="bg-[#DC143C] hover:bg-[#DC143C]/90 text-white"
            >
              {primaryAction.label}
            </Button>
          )}
          
          {onRetry && (
            <Button 
              variant={primaryAction ? "outline" : "default"}
              size="sm"
              onClick={onRetry}
              className={primaryAction 
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
