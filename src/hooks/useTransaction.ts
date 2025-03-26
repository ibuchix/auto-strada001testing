
/**
 * Changes made:
 * - Fixed imports for TransactionStatus instead of TRANSACTION_STATUS
 * - Removed generic type parameter from execute method
 * - Ensured consistent type usage for transaction status
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  TransactionType, 
  TransactionStatus,
  TransactionOptions
} from '@/services/supabase/transactions/types';
import { transactionService } from '@/services/supabase/transactions';

// Use enum values directly from the TransactionStatus enum
const TRANSACTION_STATUS = {
  IDLE: 'idle' as const,
  PENDING: 'pending' as const,
  SUCCESS: 'success' as const,
  ERROR: 'error' as const
};

export interface TransactionResult<T = any> {
  data: T | null;
  error: Error | null;
}

export interface TransactionHookOptions {
  showToast?: boolean;
  toastDuration?: number;
  logToDb?: boolean;
  retryCount?: number;
  retryDelay?: number;
}

export function useCreateTransaction(options: TransactionHookOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus | 'idle'>(
    TRANSACTION_STATUS.IDLE
  );

  /**
   * Reset the transaction state
   */
  const reset = useCallback(() => {
    setIsLoading(false);
    setTransactionId(null);
    setTransactionStatus(TRANSACTION_STATUS.IDLE);
  }, []);

  /**
   * Execute a transaction with error handling
   * Fix for error 4: Removed generic type parameter
   */
  const execute = useCallback(
    async (
      operation: string,
      callback: () => Promise<any>,
      customOptions: Partial<TransactionOptions> = {}
    ): Promise<any> => {
      // Configure transaction options by merging defaults with custom options
      const transactionOptions: TransactionOptions = {
        showToast: options.showToast ?? true,
        toastDuration: options.toastDuration ?? 5000,
        logToDb: options.logToDb ?? true,
        retryCount: options.retryCount ?? 0,
        retryDelay: options.retryDelay ?? 1000,
        ...customOptions
      };

      // Generate a unique transaction ID if we don't have one yet
      if (!transactionId) {
        setTransactionId(crypto.randomUUID());
      }

      // Start the loading state and set status to pending
      setIsLoading(true);
      setTransactionStatus(TransactionStatus.PENDING);

      try {
        // Call the service layer to execute the operation with tracking
        const result = await transactionService.executeTransaction(
          operation,
          customOptions.type || TransactionType.OTHER, // Default to OTHER type if not specified
          callback,
          {
            ...transactionOptions,
            onSuccess: (data) => {
              // Update UI state on success
              setTransactionStatus(TransactionStatus.SUCCESS);
              setIsLoading(false);

              // Call custom onSuccess if provided
              if (customOptions.onSuccess) {
                customOptions.onSuccess(data);
              }
            },
            onError: (error) => {
              // Update UI state on error
              setTransactionStatus(TransactionStatus.ERROR);
              setIsLoading(false);

              // Call custom onError if provided
              if (customOptions.onError) {
                customOptions.onError(error);
              }
            }
          }
        );

        return result;
      } catch (error) {
        // Ensure the UI state is updated even if the transaction service throws
        setTransactionStatus(TransactionStatus.ERROR);
        setIsLoading(false);
        return null;
      }
    },
    [options, transactionId]
  );

  return {
    execute,
    isLoading,
    transactionId,
    transactionStatus,
    reset
  };
}

/**
 * Simplified hook for creating and executing transactions
 */
export function useTransaction() {
  const { execute, isLoading, transactionStatus, reset } = useCreateTransaction();

  const executeTransaction = async (
    operation: string,
    type: TransactionType,
    callback: () => Promise<any>,
    options?: Partial<TransactionOptions>
  ): Promise<any> => {
    return execute(operation, callback, { ...options, type });
  };

  return {
    executeTransaction,
    isLoading,
    transactionStatus,
    reset
  };
}
