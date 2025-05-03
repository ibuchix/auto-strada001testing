
/**
 * Notification component for displaying transaction status
 * - 2025-06-15: Fixed TransactionStatus reference issues
 * - 2025-06-23: Fixed TransactionStatus import path
 */

import { AlertCircle, CheckCircle, Loader2, XCircle } from "lucide-react";
import { TransactionStatus } from "@/services/supabase/transactions/types";

interface TransactionNotificationProps {
  status: TransactionStatus;
  message: string;
  description?: string;
  onClose?: () => void;
}

export const TransactionNotification = ({
  status,
  message,
  description,
  onClose
}: TransactionNotificationProps) => {
  // Determine icon and color based on status
  const getIconAndColor = () => {
    if (status === TransactionStatus.PENDING) {
      return {
        icon: <Loader2 className="h-4 w-4 animate-spin" />,
        color: "bg-blue-50 text-blue-800 border-blue-300"
      };
    }
    if (status === TransactionStatus.SUCCESS) {
      return {
        icon: <CheckCircle className="h-4 w-4" />,
        color: "bg-green-50 text-green-800 border-green-300"
      };
    }
    if (status === TransactionStatus.ERROR) {
      return {
        icon: <AlertCircle className="h-4 w-4" />,
        color: "bg-red-50 text-red-800 border-red-300"
      };
    }
    return {
      icon: null,
      color: "bg-gray-50 text-gray-800 border-gray-300"
    };
  };

  const { icon, color } = getIconAndColor();

  return (
    <div 
      className={`flex items-center gap-x-3 rounded-md border p-3 ${color} mb-4`}
      role="alert"
    >
      {icon && <div className="flex-shrink-0">{icon}</div>}
      <div className="flex-grow">
        <p className="font-medium">{message}</p>
        {description && <p className="text-sm">{description}</p>}
      </div>
      {onClose && (
        <button 
          onClick={onClose} 
          className="flex-shrink-0 p-1"
          aria-label="Close notification"
        >
          <XCircle className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
