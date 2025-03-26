
/**
 * Changes made:
 * - 2028-06-01: Created a transaction state indicator component for better user feedback
 */

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import { TransactionStatus } from "@/services/supabase/transactionService";

interface TransactionStateIndicatorProps {
  status: TransactionStatus;
  pendingText?: string;
  successText?: string;
  errorText?: string;
  onRetry?: () => void;
}

export const TransactionStateIndicator = ({
  status,
  pendingText = "Processing...",
  successText = "Success",
  errorText = "Error",
  onRetry
}: TransactionStateIndicatorProps) => {
  if (status === TransactionStatus.PENDING) {
    return (
      <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 flex items-center gap-1.5">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>{pendingText}</span>
      </Badge>
    );
  }
  
  if (status === TransactionStatus.SUCCESS) {
    return (
      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 flex items-center gap-1.5">
        <CheckCircle className="h-3 w-3" />
        <span>{successText}</span>
      </Badge>
    );
  }
  
  if (status === TransactionStatus.ERROR) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300 flex items-center gap-1.5">
          <AlertTriangle className="h-3 w-3" />
          <span>{errorText}</span>
        </Badge>
        
        {onRetry && (
          <Button 
            variant="ghost" 
            size="sm"
            className="h-5 px-2 text-xs" 
            onClick={onRetry}
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
