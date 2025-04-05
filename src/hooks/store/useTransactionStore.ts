
/**
 * Hook for accessing transaction state from the central store
 * Created: 2025-04-09
 * Updated: 2025-04-15 - Updated to use refactored store
 */

import { useStore } from '@/store';
import { toast } from 'sonner';
import { useCallback } from 'react';
import { TransactionStatus } from '@/store';

export interface TransactionOptions {
  description?: string;
  metadata?: Record<string, any>;
  showToast?: boolean;
  toastDuration?: number;
}

export const useTransactionStore = () => {
  // Access transaction-related state from the store
  const currentTransaction = useStore(state => state.currentTransaction);
  const transactionCount = useStore(state => state.transactionCount);
  const transactions = useStore(state => state.transactions);
  const startTransaction = useStore(state => state.startTransaction);
  const completeTransaction = useStore(state => state.completeTransaction);
  const failTransaction = useStore(state => state.failTransaction);
  const resetTransaction = useStore(state => state.resetTransaction);

  // Enhanced start transaction with toast
  const beginTransaction = useCallback((name: string, options: TransactionOptions = {}) => {
    const { showToast = true, toastDuration = 0 } = options;
    
    const transaction = startTransaction(name, options);
    
    if (showToast) {
      toast.loading(`Processing ${name}...`, {
        id: `transaction-${transaction.id}`, 
        description: options.description,
        duration: toastDuration
      });
    }
    
    return transaction;
  }, [startTransaction]);

  // Enhanced complete transaction with toast
  const finishTransaction = useCallback((id: string, result: any) => {
    completeTransaction(id, result);
    
    // Find transaction by ID
    const transaction = transactions.find(t => t.id === id);
    if (transaction) {
      toast.success(`${transaction.name} completed`, {
        id: `transaction-${id}`,
        description: transaction.description
      });
    }
  }, [completeTransaction, transactions]);

  // Enhanced fail transaction with toast
  const failTransactionWithToast = useCallback((id: string, error: any) => {
    failTransaction(id, error);
    
    // Find transaction by ID
    const transaction = transactions.find(t => t.id === id);
    if (transaction) {
      toast.error(`${transaction.name} failed`, {
        id: `transaction-${id}`,
        description: error.message || transaction.description
      });
    }
  }, [failTransaction, transactions]);

  return {
    // State
    currentTransaction,
    transactionCount,
    transactions,
    
    // Original actions
    startTransaction,
    completeTransaction,
    failTransaction,
    resetTransaction,
    
    // Enhanced actions
    beginTransaction,
    finishTransaction,
    failTransactionWithToast
  };
};
