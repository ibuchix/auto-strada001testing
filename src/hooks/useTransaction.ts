
/**
 * Changes made:
 * - 2024-10-16: Created hook for transaction confirmation and tracking
 * - 2024-10-25: Fixed type issues with callback functions and parameter counts
 * - 2024-10-31: Updated to use TransactionType.OTHER instead of GENERAL
 * - 2025-12-01: Fixed import and usage of TransactionStatus and TransactionType
 */

import { useState, useCallback } from "react";
import { 
  transactionService, 
  TransactionType, 
  TransactionStatus,
  TransactionDetails,
  TransactionOptions
} from "@/services/supabase/transactions";

interface UseTransactionOptions extends Omit<TransactionOptions, 'onSuccess' | 'onError' | 'onComplete'> {
  onSuccess?: (result: any) => void;
  onError?: (error: any) => void;
}

/**
 * Hook for transaction confirmation with better error handling and tracking
 */
export function useTransaction(options: UseTransactionOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [lastTransactionId, setLastTransactionId] = useState<string | null>(null);
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus | null>(null);
  const [error, setError] = useState<any>(null);

  const executeTransaction = useCallback(
    async <T,>(
      operation: string,
      type: TransactionType,
      callback: () => Promise<T>,
      transactionOptions?: Partial<TransactionOptions>
    ): Promise<T | null> => {
      setIsLoading(true);
      setError(null);
      setTransactionStatus(TransactionStatus.PENDING);

      try {
        const result = await transactionService.executeTransaction<T>(
          operation,
          type,
          callback,
          {
            ...options,
            ...transactionOptions,
            onSuccess: (result) => {
              setLastTransactionId(crypto.randomUUID());
              setTransactionStatus(TransactionStatus.SUCCESS);
              if (options.onSuccess) options.onSuccess(result);
              if (transactionOptions?.onSuccess) transactionOptions.onSuccess(result);
            },
            onError: (err) => {
              setLastTransactionId(crypto.randomUUID());
              setTransactionStatus(TransactionStatus.ERROR);
              setError(err);
              if (options.onError) options.onError(err);
              if (transactionOptions?.onError) transactionOptions.onError(err);
            }
          }
        );

        return result;
      } catch (err) {
        // Error already handled by the service
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [options]
  );

  const reset = useCallback(() => {
    setIsLoading(false);
    setLastTransactionId(null);
    setTransactionStatus(null);
    setError(null);
  }, []);

  return {
    executeTransaction,
    isLoading,
    error,
    transactionStatus,
    lastTransactionId,
    isSuccess: transactionStatus === TransactionStatus.SUCCESS,
    isError: transactionStatus === TransactionStatus.ERROR,
    isPending: transactionStatus === TransactionStatus.PENDING,
    reset
  };
}

/**
 * Helper function for common transaction types
 */
export function useCreateTransaction(options: UseTransactionOptions = {}) {
  const transaction = useTransaction(options);
  
  const execute = useCallback(
    <T,>(operation: string, callback: () => Promise<T>, opts?: Partial<TransactionOptions>) => {
      return transaction.executeTransaction<T>(operation, TransactionType.CREATE, callback, opts);
    },
    [transaction]
  );
  
  return { ...transaction, execute };
}

export function useUpdateTransaction(options: UseTransactionOptions = {}) {
  const transaction = useTransaction(options);
  
  const execute = useCallback(
    <T,>(operation: string, callback: () => Promise<T>, opts?: Partial<TransactionOptions>) => {
      return transaction.executeTransaction<T>(operation, TransactionType.UPDATE, callback, opts);
    },
    [transaction]
  );
  
  return { ...transaction, execute };
}

export function useDeleteTransaction(options: UseTransactionOptions = {}) {
  const transaction = useTransaction(options);
  
  const execute = useCallback(
    <T,>(operation: string, callback: () => Promise<T>, opts?: Partial<TransactionOptions>) => {
      return transaction.executeTransaction<T>(operation, TransactionType.DELETE, callback, opts);
    },
    [transaction]
  );
  
  return { ...transaction, execute };
}

export function useAuctionTransaction(options: UseTransactionOptions = {}) {
  const transaction = useTransaction(options);
  
  const execute = useCallback(
    <T,>(operation: string, callback: () => Promise<T>, opts?: Partial<TransactionOptions>) => {
      return transaction.executeTransaction<T>(operation, TransactionType.AUCTION, callback, opts);
    },
    [transaction]
  );
  
  return { ...transaction, execute };
}
