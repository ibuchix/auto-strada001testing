
/**
 * Changes made:
 * - 2024-10-16: Created TransactionStatusIndicator component for visual transaction status feedback
 */

import { CheckCircle, AlertCircle, Clock, XCircle } from "lucide-react";
import { TransactionStatus } from "@/services/supabase/transactionService";

interface TransactionStatusIndicatorProps {
  status: TransactionStatus | null;
  showLabel?: boolean;
  showIcon?: boolean;
  className?: string;
  pendingText?: string;
  successText?: string;
  errorText?: string;
  warningText?: string;
}

export const TransactionStatusIndicator = ({
  status,
  showLabel = true,
  showIcon = true,
  className = "",
  pendingText = "Processing...",
  successText = "Completed",
  errorText = "Failed",
  warningText = "Warning"
}: TransactionStatusIndicatorProps) => {
  if (!status) return null;

  const getStatusConfig = () => {
    switch (status) {
      case TransactionStatus.PENDING:
        return {
          icon: <Clock className="h-4 w-4 animate-pulse" />,
          text: pendingText,
          className: "text-amber-500"
        };
      case TransactionStatus.SUCCESS:
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          text: successText,
          className: "text-[#21CA6F]"
        };
      case TransactionStatus.ERROR:
        return {
          icon: <XCircle className="h-4 w-4" />,
          text: errorText,
          className: "text-[#DC143C]"
        };
      case TransactionStatus.WARNING:
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          text: warningText,
          className: "text-amber-500"
        };
      default:
        return {
          icon: <Clock className="h-4 w-4" />,
          text: "Unknown",
          className: "text-gray-500"
        };
    }
  };

  const { icon, text, className: statusClassName } = getStatusConfig();

  return (
    <div className={`flex items-center gap-1.5 ${className} ${statusClassName}`}>
      {showIcon && icon}
      {showLabel && <span className="text-sm">{text}</span>}
    </div>
  );
};
