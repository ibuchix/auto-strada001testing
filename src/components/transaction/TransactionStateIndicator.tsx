
/**
 * Transaction status indicator component with appropriate status visuals
 */
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { TransactionStatus } from "@/types/forms";
import { TRANSACTION_STATUS } from "@/services/supabase/transactionService";

export interface TransactionStatusIndicatorProps {
  status: TransactionStatus;
  className?: string;
}

export const TransactionStateIndicator = ({ 
  status, 
  className = '' 
}: TransactionStatusIndicatorProps) => {
  if (!status || status === TRANSACTION_STATUS.IDLE) {
    return null;
  }

  // Pending state
  if (status === TRANSACTION_STATUS.PENDING) {
    return (
      <div className={`flex items-center text-blue-600 ${className}`}>
        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
        <span className="text-sm font-medium">Processing...</span>
      </div>
    );
  }

  // Success state
  if (status === TRANSACTION_STATUS.SUCCESS) {
    return (
      <div className={`flex items-center text-green-600 ${className}`}>
        <CheckCircle className="mr-1 h-4 w-4" />
        <span className="text-sm font-medium">Complete</span>
      </div>
    );
  }

  // Error state
  if (status === TRANSACTION_STATUS.ERROR) {
    return (
      <div className={`flex items-center text-destructive ${className}`}>
        <AlertCircle className="mr-1 h-4 w-4" />
        <span className="text-sm font-medium">Error</span>
      </div>
    );
  }

  return null;
};
