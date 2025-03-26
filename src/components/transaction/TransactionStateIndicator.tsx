
/**
 * Component to display current transaction state with visual feedback
 * - 2027-08-12: Created component for better transaction state visualization
 */
import { useState, useEffect } from "react";
import { Loader2, CheckCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { TransactionStatus } from "@/services/supabase/transactionService";
import { Button } from "@/components/ui/button";

interface TransactionStateIndicatorProps {
  status: TransactionStatus;
  label?: string;
  pendingText?: string;
  successText?: string;
  errorText?: string;
  onRetry?: () => void;
  showProgress?: boolean;
  autoReset?: boolean;
  resetTime?: number;
}

export const TransactionStateIndicator = ({
  status,
  label,
  pendingText = "Processing...",
  successText = "Completed successfully",
  errorText = "Failed to complete",
  onRetry,
  showProgress = true,
  autoReset = true,
  resetTime = 5000
}: TransactionStateIndicatorProps) => {
  const [progress, setProgress] = useState(0);
  const [pendingTime, setPendingTime] = useState(0);
  
  // Auto-reset success state after some time
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (status === TransactionStatus.SUCCESS && autoReset) {
      timer = setTimeout(() => {
        // Just hide the component - don't actually reset the status
        setProgress(0);
      }, resetTime);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [status, autoReset, resetTime]);
  
  // Progress animation when pending
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (status === TransactionStatus.PENDING && showProgress) {
      timer = setInterval(() => {
        setProgress(prev => {
          // Cap progress at 90% until we get confirmation
          return prev < 90 ? prev + 1 : 90;
        });
        
        setPendingTime(prev => prev + 100);
      }, 100);
    } else if (status === TransactionStatus.SUCCESS) {
      setProgress(100);
    } else if (status === TransactionStatus.ERROR) {
      setProgress(0);
    } else {
      setProgress(0);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [status, showProgress]);
  
  if (!status || (status === TransactionStatus.SUCCESS && progress === 0)) {
    return null;
  }
  
  const getStatusColor = () => {
    switch (status) {
      case TransactionStatus.PENDING:
        return "text-blue-500";
      case TransactionStatus.SUCCESS:
        return "text-green-500";
      case TransactionStatus.ERROR:
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };
  
  const getStatusIcon = () => {
    switch (status) {
      case TransactionStatus.PENDING:
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case TransactionStatus.SUCCESS:
        return <CheckCircle className="h-4 w-4" />;
      case TransactionStatus.ERROR:
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return null;
    }
  };
  
  const getText = () => {
    switch (status) {
      case TransactionStatus.PENDING:
        return pendingText;
      case TransactionStatus.SUCCESS:
        return successText;
      case TransactionStatus.ERROR:
        return errorText;
      default:
        return "";
    }
  };
  
  return (
    <div className="space-y-2">
      {label && <div className="text-sm font-medium">{label}</div>}
      <div className="flex items-center gap-2">
        <span className={getStatusColor()}>{getStatusIcon()}</span>
        <span className="text-sm">{getText()}</span>
        
        {status === TransactionStatus.ERROR && onRetry && (
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-auto"
            onClick={onRetry}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        )}
        
        {status === TransactionStatus.PENDING && pendingTime > 10000 && (
          <span className="text-xs text-amber-500 ml-auto">
            Taking longer than expected...
          </span>
        )}
      </div>
      
      {showProgress && (status === TransactionStatus.PENDING || status === TransactionStatus.SUCCESS) && (
        <Progress 
          value={progress} 
          className="h-1" 
          indicatorClassName={status === TransactionStatus.SUCCESS ? "bg-green-500" : "bg-blue-500"} 
        />
      )}
    </div>
  );
};
