
/**
 * Specialized transaction hook for auction operations
 * - Simplified implementation
 * - Removed diagnostic dependencies
 * - Fixed TypeScript compatibility issues with executeTransaction parameters
 */
import { useCreateTransaction } from "./useTransaction";
import { TransactionType } from "@/services/supabase/transactions/types";

export const useAuctionTransaction = () => {
  const transaction = useCreateTransaction({
    showToast: true,
    retryCount: 1
  });
  
  // Updated function signature to match how it's called in BidForm
  const executeTransaction = async (
    name: string,
    operation: () => Promise<any>,
    options: any = {}
  ) => {
    return transaction.execute(name, operation, {
      ...options,
      // Set the transaction type to AUCTION by default
      type: TransactionType.AUCTION
    });
  };
  
  return {
    ...transaction,
    executeTransaction
  };
};
