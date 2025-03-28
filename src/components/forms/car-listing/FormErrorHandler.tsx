
/**
 * Changes made:
 * - 2024-09-05: Extracted from CarListingForm.tsx to separate component
 * - 2025-11-02: Enhanced with draft error handling capabilities
 * - 2025-11-03: Added retry functionality with loading state indicator
 */

import { ErrorHandler } from "./submission/ErrorHandler";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface FormErrorHandlerProps {
  error?: string;
  draftError?: Error | null;
  onRetry?: () => void;
}

export const FormErrorHandler = ({ 
  error = "Please sign in to create a listing. Your progress will be saved.", 
  draftError,
  onRetry 
}: FormErrorHandlerProps) => {
  const [isRetrying, setIsRetrying] = useState(false);

  // If we have a draft error, show a specialized error message
  if (draftError) {
    return (
      <Alert variant="destructive" className="mb-8">
        <AlertCircle className="h-5 w-5" />
        <AlertTitle>Failed to load draft</AlertTitle>
        <AlertDescription className="mt-2">
          <p className="mb-4">
            {draftError.message || "There was a problem loading your saved draft."}
          </p>
          {onRetry && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setIsRetrying(true);
                onRetry();
                setTimeout(() => setIsRetrying(false), 2000);
              }}
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

  // Otherwise, show the standard error handler
  return <ErrorHandler error={error} />;
};
