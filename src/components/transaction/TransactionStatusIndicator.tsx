
/**
 * Changes made:
 * - 2028-06-01: Created transaction status indicator for better user feedback
 * - 2028-07-24: Added pendingText, successText, errorText props for customization
 */

import { useEffect, useState } from "react";
import { cva } from "class-variance-authority";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { TransactionStatus } from "@/services/supabase/transactions/types";

// Define status color and icon variants
const statusIconVariants = cva("w-4 h-4", {
  variants: {
    status: {
      pending: "text-blue-500 animate-spin",
      success: "text-green-500",
      error: "text-red-500",
      inactive: "text-gray-400",
    },
  },
  defaultVariants: {
    status: "inactive",
  },
});

const statusBgVariants = cva("rounded-full flex items-center justify-center transition-all", {
  variants: {
    status: {
      pending: "bg-blue-100",
      success: "bg-green-100",
      error: "bg-red-100",
      inactive: "bg-gray-100",
    },
    size: {
      sm: "w-5 h-5",
      md: "w-6 h-6",
      lg: "w-8 h-8",
    },
  },
  defaultVariants: {
    status: "inactive",
    size: "md",
  },
});

const statusTextVariants = cva("text-xs font-medium", {
  variants: {
    status: {
      pending: "text-blue-700",
      success: "text-green-700",
      error: "text-red-700",
      inactive: "text-gray-500",
    },
  },
  defaultVariants: {
    status: "inactive",
  },
});

export interface TransactionStatusIndicatorProps {
  status?: TransactionStatus | null;
  label?: string;
  hideLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  autoHideDelay?: number;
  pendingText?: string;
  successText?: string;
  errorText?: string;
  onRetry?: () => void;
}

export const TransactionStatusIndicator = ({
  status,
  label,
  hideLabel = false,
  size = "md",
  className = "",
  autoHideDelay = 0,
  pendingText,
  successText,
  errorText,
  onRetry
}: TransactionStatusIndicatorProps) => {
  const [visible, setVisible] = useState(true);
  
  // Auto-hide functionality
  useEffect(() => {
    if (autoHideDelay > 0 && status === TransactionStatus.SUCCESS) {
      const timer = setTimeout(() => {
        setVisible(false);
      }, autoHideDelay);
      
      return () => clearTimeout(timer);
    }
  }, [status, autoHideDelay]);
  
  if (!visible) return null;
  
  // Map the enum values to string for variant handling
  let statusVariant: "inactive" | "pending" | "success" | "error" = "inactive";
  if (status === TransactionStatus.PENDING) statusVariant = "pending";
  else if (status === TransactionStatus.SUCCESS) statusVariant = "success";
  else if (status === TransactionStatus.ERROR) statusVariant = "error";
  
  // Get appropriate icon
  const getStatusIcon = () => {
    switch (status) {
      case TransactionStatus.PENDING:
        return <Loader2 className={statusIconVariants({ status: statusVariant })} />;
      case TransactionStatus.SUCCESS:
        return <CheckCircle2 className={statusIconVariants({ status: statusVariant })} />;
      case TransactionStatus.ERROR:
        return <AlertTriangle className={statusIconVariants({ status: statusVariant })} />;
      default:
        return null;
    }
  };
  
  // Get appropriate label text
  const getLabelText = () => {
    if (label) return label;
    
    switch (status) {
      case TransactionStatus.PENDING:
        return pendingText || "Processing...";
      case TransactionStatus.SUCCESS:
        return successText || "Complete";
      case TransactionStatus.ERROR:
        return errorText || "Error";
      default:
        return "";
    }
  };

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <div className={statusBgVariants({ status: statusVariant, size })}>
        {getStatusIcon()}
      </div>
      
      {!hideLabel && (
        <span className={statusTextVariants({ status: statusVariant })}>
          {getLabelText()}
        </span>
      )}
      
      {status === TransactionStatus.ERROR && onRetry && (
        <button 
          onClick={onRetry}
          className="text-xs underline text-red-700 ml-2 hover:text-red-800"
        >
          Retry
        </button>
      )}
    </div>
  );
};
