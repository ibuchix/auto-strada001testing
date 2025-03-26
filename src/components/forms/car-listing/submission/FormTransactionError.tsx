
/**
 * Changes made:
 * - 2028-07-14: Created FormTransactionError component for displaying transaction errors
 */

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TransactionStateIndicator } from "@/components/transaction/TransactionStateIndicator";
import { TransactionStatus } from "@/services/supabase/transactionService";

interface FormTransactionErrorProps {
  error: string;
  onRetry?: () => void;
}

export const FormTransactionError = ({ error, onRetry }: FormTransactionErrorProps) => {
  return (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="ml-2">Submission Error</AlertTitle>
      <AlertDescription className="mt-2 flex items-center justify-between">
        <div className="space-y-2">
          <p>{error}</p>
          <TransactionStateIndicator 
            status={TransactionStatus.ERROR} 
            errorText="Submission failed"
            onRetry={onRetry}
          />
        </div>
        {onRetry && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry} 
            className="ml-4"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};
