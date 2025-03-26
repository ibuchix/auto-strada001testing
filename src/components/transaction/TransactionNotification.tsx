
/**
 * Changes made:
 * - 2024-10-16: Created transaction notification component for use with sonner
 * - 2024-07-24: Fixed TransactionStatus reference
 */

import { CheckCircle, XCircle, AlertCircle, Clock } from "lucide-react";
import { TransactionStatus } from "@/services/supabase/transactions/types";

interface TransactionNotificationProps {
  title: string;
  description?: string;
  status: TransactionStatus;
}

export const TransactionNotification = ({ 
  title, 
  description, 
  status 
}: TransactionNotificationProps) => {
  const getStatusIcon = () => {
    switch (status) {
      case TransactionStatus.SUCCESS:
        return <CheckCircle className="h-5 w-5 text-[#21CA6F]" />;
      case TransactionStatus.ERROR:
        return <XCircle className="h-5 w-5 text-[#DC143C]" />;
      case TransactionStatus.WARNING:
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case TransactionStatus.PENDING:
        return <Clock className="h-5 w-5 text-[#4B4DED]" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex items-start gap-3">
      <div className="mt-1">{getStatusIcon()}</div>
      <div>
        <h4 className="text-sm font-semibold text-[#222020]">{title}</h4>
        {description && (
          <p className="text-xs text-[#6A6A77] mt-1">{description}</p>
        )}
      </div>
    </div>
  );
};
