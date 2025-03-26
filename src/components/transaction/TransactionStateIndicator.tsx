
/**
 * Changes made:
 * - 2028-07-24: Created TransactionStateIndicator component
 */

import { TransactionStatus } from "@/services/supabase/transactions/types";
import { TransactionStatusIndicator } from "./TransactionStatusIndicator";

export interface TransactionStateIndicatorProps {
  status: TransactionStatus;
  pendingText?: string;
  successText?: string;
  errorText?: string;
  onRetry?: () => void;
}

export const TransactionStateIndicator = ({
  status,
  pendingText = "Processing...",
  successText = "Complete",
  errorText = "Error",
  onRetry
}: TransactionStateIndicatorProps) => {
  return (
    <TransactionStatusIndicator
      status={status}
      pendingText={pendingText}
      successText={successText}
      errorText={errorText}
      onRetry={onRetry}
    />
  );
};
