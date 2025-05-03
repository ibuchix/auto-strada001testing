
/**
 * Specialized transaction hook for auction operations
 * - Simplified implementation
 * - Removed diagnostic dependencies
 * - Fixed TypeScript compatibility issues with executeTransaction parameters
 * - Updated: 2025-05-12 - Fixed import to use useTransaction instead of non-existent useCreateTransaction
 * - Updated: 2025-05-03 - Fixed type error with TransactionType usage
 * - Updated: 2025-05-08 - Fixed parameter order in executeTransaction function call
 * - Updated: 2025-05-08 - Fixed TransactionType import and usage
 */
import { useTransaction } from "./useTransaction";
import { TransactionType } from "@/services/supabase/transactions/types";

export const useAuctionTransaction = () => {
  const transaction = useTransaction();
  
  // Updated function signature to match how it's called in BidForm
  const executeTransaction = async (
    name: string,
    operation: () => Promise<any>,
    options: any = {}
  ) => {
    return transaction.executeTransaction(
      name, 
      TransactionType.AUCTION as TransactionType, // Explicitly cast to TransactionType
      operation, 
      {
        ...options,
      }
    );
  };
  
  return {
    ...transaction,
    executeTransaction
  };
};
