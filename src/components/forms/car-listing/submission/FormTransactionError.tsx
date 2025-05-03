
/**
 * Form Transaction Error component
 * Created: 2025-07-12
 */

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AppError } from '@/errors/classes';
import { AlertCircle } from 'lucide-react';

interface FormTransactionErrorProps {
  error: AppError | Error | unknown;
  onRetry?: () => void;
}

export const FormTransactionError: React.FC<FormTransactionErrorProps> = ({
  error,
  onRetry
}) => {
  // Format the error message
  const getErrorMessage = () => {
    if (error instanceof AppError) {
      return error.message;
    } else if (error instanceof Error) {
      return error.message;
    } else {
      return 'An unknown error occurred';
    }
  };

  return (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex flex-col space-y-2">
        <p>{getErrorMessage()}</p>
        
        {onRetry && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={onRetry}
            className="mt-2 self-start"
          >
            Try Again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};
