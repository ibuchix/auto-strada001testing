
/**
 * Specialized transaction hook for auction operations
 */
import { useCreateTransaction } from "./useTransaction";
import { TransactionType } from "@/services/supabase/transactionService";

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

