
/**
 * Changes made:
 * - 2028-07-24: Created TransactionStateIndicator component
 * - 2024-10-31: Updated to use standard TransactionStatus import
 * - 2025-12-01: Fixed import for TransactionStatus
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
