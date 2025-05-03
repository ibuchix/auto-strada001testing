
/**
 * Transaction status indicator component with appropriate status visuals
 * - 2025-06-23: Fixed TransactionStatus import and usage
 * - 2025-07-02: Fixed enum comparisons
 */
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { TransactionStatus } from "@/services/supabase/transactions/types";

export interface TransactionStatusIndicatorProps {
  status: TransactionStatus | null;
  className?: string;
}

export const TransactionStateIndicator = ({ 
  status, 
  className = '' 
}: TransactionStatusIndicatorProps) => {
  if (!status || status === TransactionStatus.IDLE) {
    return null;
  }

  // Pending state
  if (status === TransactionStatus.PENDING) {
    return (
      <div className={`flex items-center text-blue-600 ${className}`}>
        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
        <span className="text-sm font-medium">Processing...</span>
      </div>
    );
  }

  // Success state
  if (status === TransactionStatus.SUCCESS) {
    return (
      <div className={`flex items-center text-green-600 ${className}`}>
        <CheckCircle className="mr-1 h-4 w-4" />
        <span className="text-sm font-medium">Complete</span>
      </div>
    );
  }

  // Error state
  if (status === TransactionStatus.ERROR) {
    return (
      <div className={`flex items-center text-destructive ${className}`}>
        <AlertCircle className="mr-1 h-4 w-4" />
        <span className="text-sm font-medium">Error</span>
      </div>
    );
  }

  return null;
};
