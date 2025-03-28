
/**
 * Changes made:
 * - 2024-06-07: Created FormTransactionError component to display form submission errors
 * - 2025-12-05: Updated to work with the new error architecture
 */

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BaseApplicationError } from "@/errors/classes";

interface FormTransactionErrorProps {
  error: string | BaseApplicationError;
  onRetry?: () => void;
}

export const FormTransactionError = ({ 
  error, 
  onRetry 
}: FormTransactionErrorProps) => {
  // Extract error details, handling both string and BaseApplicationError types
  const errorMessage = typeof error === 'string' 
    ? error 
    : error instanceof BaseApplicationError 
      ? error.message 
      : 'An error occurred';
  
  const errorDescription = error instanceof BaseApplicationError 
    ? error.description 
    : undefined;

  const retryAction = onRetry || (error instanceof BaseApplicationError && error.recovery?.action);
  const retryLabel = error instanceof BaseApplicationError && error.recovery 
    ? error.recovery.label 
    : 'Try again';
  
  return (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <div className="flex flex-col space-y-2">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{errorMessage}</AlertDescription>
        
        {errorDescription && (
          <AlertDescription className="text-sm opacity-80">
            {errorDescription}
          </AlertDescription>
        )}
        
        {retryAction && (
          <div className="mt-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={retryAction}
              className="text-[#DC143C] border-[#DC143C] hover:bg-[#DC143C]/10"
            >
              {retryLabel}
            </Button>
          </div>
        )}
      </div>
    </Alert>
  );
};
