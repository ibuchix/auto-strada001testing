
/**
 * Specialized transaction hook for auction operations
 * - Simplified implementation
 * - Removed diagnostic dependencies
 * - Fixed TypeScript compatibility issues
 */
import { useCreateTransaction } from "./useTransaction";
import { TransactionType } from "@/services/supabase/transactions/types";

export const useAuctionTransaction = () => {
  const transaction = useCreateTransaction({
    showToast: true,
    retryCount: 1
  });
  
  const executeTransaction = async (
    name: string,
    type: TransactionType = TransactionType.AUCTION,
    operation: () => Promise<any>,
    options: any = {}
  ) => {
    return transaction.execute(name, operation, options);
  };
  
  return {
    ...transaction,
    executeTransaction
  };
};
