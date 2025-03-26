
/**
 * Changes made:
 * - 2023-07-15: Created FormTransactionError component for displaying transaction errors
 */

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FormTransactionErrorProps {
  error: string;
  onRetry?: () => void;
}

export const FormTransactionError = ({ error, onRetry }: FormTransactionErrorProps) => {
  return (
    <Alert variant="destructive" className="border-red-500 bg-red-50">
      <AlertCircle className="h-4 w-4 text-red-600" />
      <AlertTitle className="text-red-800">Error submitting form</AlertTitle>
      <AlertDescription className="text-red-700">
        <p className="mb-2">{error}</p>
        {onRetry && (
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-white border-red-300 text-red-600 hover:bg-red-50"
            onClick={onRetry}
          >
            Try Again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};
