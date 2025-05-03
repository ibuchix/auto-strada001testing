
/**
 * TransactionNotification component for displaying transaction status
 * Updated: 2025-07-02 - Fixed TransactionStatus import and enum comparisons
 */

import { useEffect } from "react";
import { toast } from "sonner";
import { TransactionStateIndicator } from "./TransactionStateIndicator";
import { TransactionStatus } from "@/services/supabase/transactions/types";

interface TransactionNotificationProps {
  status: TransactionStatus | null;
  message?: string;
}

export const TransactionNotification = ({
  status,
  message = "Transaction"
}: TransactionNotificationProps) => {
  useEffect(() => {
    if (!status) return;

    if (status === TransactionStatus.PENDING) {
      toast(
        "Processing...",
        {
          description: `${message} is being processed...`,
          duration: 0
        }
      );
    } else if (status === TransactionStatus.SUCCESS) {
      toast.success(
        "Success!",
        {
          description: `${message} completed successfully.`,
          duration: 3000
        }
      );
    } else if (status === TransactionStatus.ERROR) {
      toast.error(
        "Error!",
        {
          description: `${message} could not be completed.`,
          duration: 5000
        }
      );
    }
  }, [status, message]);

  return <TransactionStateIndicator status={status} />;
};
