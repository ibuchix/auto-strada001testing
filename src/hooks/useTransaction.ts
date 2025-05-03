
/**
 * Transaction hook for managing transactions
 * Created: 2025-07-02
 */

import { useState, useCallback } from "react";
import { TransactionStatus, TransactionType } from "@/services/supabase/transactions/types";

interface TransactionOptions {
  retryOnError: boolean;
  metadata: Record<string, any>;
}

export const useTransaction = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus | 'idle'>('idle');

  const executeTransaction = useCallback(
    async (
      operation: string,
      type: TransactionType,
      callback: () => Promise<any>,
      options: Partial<TransactionOptions> = {}
    ) => {
      setIsLoading(true);
      setTransactionStatus(TransactionStatus.PENDING);
      
      try {
        const result = await callback();
        setTransactionStatus(TransactionStatus.SUCCESS);
        return result;
      } catch (error) {
        console.error(`Transaction error during ${operation}:`, error);
        setTransactionStatus(TransactionStatus.ERROR);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );
  
  const reset = useCallback(() => {
    setTransactionStatus('idle');
    setIsLoading(false);
  }, []);

  return {
    executeTransaction,
    isLoading,
    transactionStatus,
    reset
  };
};
