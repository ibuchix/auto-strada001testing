/**
 * Hook for creating and managing transactions
 * - 2025-06-15: Fixed TransactionStatus reference issues
 */

import { useState, useCallback } from 'react';
import { useTransaction as useTransactionContext } from '@/components/transaction/TransactionProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TransactionStatus } from '@/types/forms';
import { TRANSACTION_STATUS, TransactionOptions } from '@/services/supabase/transactionService';

interface UseCreateTransactionOptions {
  showToast?: boolean;
  retryCount?: number;
  logToDb?: boolean;
}

export const useCreateTransaction = (options: UseCreateTransactionOptions = {}) => {
  const { showToast = true, retryCount = 0, logToDb = true } = options;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus | null>(null);
  const [result, setResult] = useState<any>(null);
  
  const { startTransaction, completeTransaction, failTransaction } = useTransactionContext();
  
  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setTransactionStatus(null);
    setResult(null);
  }, []);
  
  const execute = useCallback(async <T>(
    name: string,
    operation: () => Promise<T>,
    transactionOptions: TransactionOptions = {}
  ): Promise<T | null> => {
    // Reset state
    setIsLoading(true);
    setError(null);
    setResult(null);
    setTransactionStatus(TRANSACTION_STATUS.PENDING);
    
    const {
      description,
      metadata,
      onSuccess,
      onError,
      throwOnError = false
    } = transactionOptions;
    
    // Start the transaction
    const transaction = startTransaction(name, {
      description,
      metadata,
      showToast
    });
    
    let attempts = 0;
    const maxAttempts = retryCount + 1;
    
    const attemptOperation = async (): Promise<T | null> => {
      attempts++;
      
      try {
        // Execute the operation
        const operationResult = await operation();
        
        // Update state
        setResult(operationResult);
        setTransactionStatus(TRANSACTION_STATUS.SUCCESS);
        
        // Complete the transaction
        completeTransaction(transaction.id, operationResult);
        
        // Log to database if enabled
        if (logToDb) {
          await supabase.from('transaction_logs').insert({
            transaction_id: transaction.id,
            transaction_name: name,
            status: TRANSACTION_STATUS.SUCCESS,
            result: JSON.stringify(operationResult),
            description,
            metadata
          }).catch(err => {
            console.error('Failed to log transaction:', err);
          });
        }
        
        // Show success toast if enabled
        if (showToast) {
          toast.success(`${name} completed`, {
            id: `transaction-${transaction.id}`,
            description: description || 'Operation completed successfully'
          });
        }
        
        // Call success callback if provided
        if (onSuccess) {
          onSuccess(operationResult);
        }
        
        return operationResult;
      } catch (err) {
        // If we have retries left, try again
        if (attempts < maxAttempts) {
          console.log(`Attempt ${attempts} failed, retrying...`);
          return attemptOperation();
        }
        
        // Otherwise handle the error
        setError(err);
        setTransactionStatus(TRANSACTION_STATUS.ERROR);
        
        // Fail the transaction
        failTransaction(transaction.id, err);
        
        // Log to database if enabled
        if (logToDb) {
          await supabase.from('transaction_logs').insert({
            transaction_id: transaction.id,
            transaction_name: name,
            status: TRANSACTION_STATUS.ERROR,
            error: JSON.stringify(err),
            description,
            metadata
          }).catch(logErr => {
            console.error('Failed to log transaction error:', logErr);
          });
        }
        
        // Show error toast if enabled
        if (showToast) {
          toast.error(`${name} failed`, {
            id: `transaction-${transaction.id}`,
            description: err.message || 'Operation failed'
          });
        }
        
        // Call error callback if provided
        if (onError) {
          onError(err);
        }
        
        // Throw the error if configured to do so
        if (throwOnError) {
          throw err;
        }
        
        return null;
      } finally {
        setIsLoading(false);
      }
    };
    
    return attemptOperation();
  }, [startTransaction, completeTransaction, failTransaction, showToast, retryCount, logToDb]);
  
  return {
    execute,
    isLoading,
    error,
    result,
    transactionStatus,
    reset
  };
};
