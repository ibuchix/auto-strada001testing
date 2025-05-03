
/**
 * Changes made:
 * - 2024-06-07: Created FormTransactionError component to display form submission errors
 * - 2024-08-14: Updated to work with the new error architecture
 * - 2024-08-15: Enhanced recovery paths and UI feedback patterns
 * - 2025-04-05: Fixed TypeScript errors with error handling
 * - 2025-07-01: Fixed RecoveryType enum references
 */

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppError } from "@/errors/classes";
import { RecoveryType } from "@/errors/types";

interface FormTransactionErrorProps {
  error: string | AppError;
  onRetry?: () => void;
}

export const FormTransactionError = ({ 
  error, 
  onRetry 
}: FormTransactionErrorProps) => {
  // Extract error details, handling both string and AppError types
  const errorMessage = typeof error === 'string' 
    ? error 
    : error instanceof AppError 
      ? error.message 
      : 'An error occurred';
  
  const errorDescription = error instanceof AppError 
    ? error.description 
    : undefined;

  const handleRetryAction = () => {
    if (error instanceof AppError && error.recovery?.handler) {
      error.recovery.handler();
    } else if (onRetry) {
      onRetry();
    }
  };
  
  // Get recovery label based on recovery type for better user context
  const getRecoveryLabel = () => {
    if (!(error instanceof AppError) || !error.recovery) {
      return 'Try again';
    }
    
    // Use the provided label if available
    if (error.recovery.label) {
      return error.recovery.label;
    }
    
    // Generate appropriate label based on recovery type
    switch (error.recovery.type) {
      case RecoveryType.FIELD_CORRECTION:
        return 'Fix Field';
      case RecoveryType.FORM_RETRY:
        return 'Try Again';
      case RecoveryType.SIGN_IN:
        return 'Sign In';
      case RecoveryType.NAVIGATE:
        return 'Continue';
      case RecoveryType.REFRESH:
        return 'Refresh';
      case RecoveryType.CONTACT_SUPPORT:
        return 'Contact Support';
      default:
        return 'Try Again';
    }
  };
  
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
        
        {(onRetry || (error instanceof AppError && error.recovery?.handler)) && (
          <div className="mt-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRetryAction}
              className="text-[#DC143C] border-[#DC143C] hover:bg-[#DC143C]/10"
            >
              {getRecoveryLabel()}
            </Button>
          </div>
        )}
      </div>
    </Alert>
  );
};
