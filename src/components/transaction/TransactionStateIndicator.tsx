
/**
 * Changes made:
 * - 2023-07-15: Created TransactionStateIndicator component
 */

import { CheckCircle, AlertCircle, Clock, RefreshCw } from "lucide-react";
import { TransactionStatus } from "@/services/supabase/transactionService";
import { Button } from "@/components/ui/button";

interface TransactionStateIndicatorProps {
  status: TransactionStatus;
  pendingText: string;
  successText: string;
  errorText: string;
  onRetry?: () => void;
}

export const TransactionStateIndicator = ({
  status,
  pendingText,
  successText,
  errorText,
  onRetry
}: TransactionStateIndicatorProps) => {
  if (status === TransactionStatus.PENDING) {
    return (
      <div className="flex items-center text-yellow-600 gap-1 text-sm">
        <Clock className="h-4 w-4 animate-pulse" />
        <span>{pendingText}</span>
      </div>
    );
  }

  if (status === TransactionStatus.SUCCESS) {
    return (
      <div className="flex items-center text-green-600 gap-1 text-sm">
        <CheckCircle className="h-4 w-4" />
        <span>{successText}</span>
      </div>
    );
  }

  if (status === TransactionStatus.ERROR) {
    return (
      <div className="flex flex-col sm:flex-row items-center text-red-600 gap-1 text-sm">
        <div className="flex items-center">
          <AlertCircle className="h-4 w-4 mr-1" />
          <span>{errorText}</span>
        </div>
        
        {onRetry && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onRetry}
            className="text-xs h-6 px-2 ml-1 text-red-600 hover:bg-red-50"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        )}
      </div>
    );
  }

  return null;
};
