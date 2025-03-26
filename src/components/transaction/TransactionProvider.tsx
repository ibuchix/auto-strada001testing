
/**
 * Provider for transaction context and state management
 * - 2025-06-15: Fixed TransactionStatus reference issues
 */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { toast } from 'sonner';
import { TransactionStatus } from '@/types/forms';
import { TRANSACTION_STATUS } from '@/services/supabase/transactionService';
import { supabase } from '@/integrations/supabase/client';

interface TransactionContextType {
  currentTransaction: Transaction | null;
  transactionCount: number;
  startTransaction: (name: string, options?: TransactionOptions) => Transaction;
  completeTransaction: (id: string, result: any) => void;
  failTransaction: (id: string, error: any) => void;
  resetTransaction: (id: string) => void;
}

export interface Transaction {
  id: string;
  name: string;
  status: TransactionStatus;
  startTime: Date;
  endTime?: Date;
  result?: any;
  error?: any;
  description?: string;
  metadata?: Record<string, any>;
}

export interface TransactionOptions {
  description?: string;
  metadata?: Record<string, any>;
  showToast?: boolean;
}

// Create the transaction context
const TransactionContext = createContext<TransactionContextType>({
  currentTransaction: null,
  transactionCount: 0,
  startTransaction: () => ({} as Transaction),
  completeTransaction: () => {},
  failTransaction: () => {},
  resetTransaction: () => {},
});

// Custom hook to use the transaction context
export const useTransaction = () => useContext(TransactionContext);

// TransactionProvider component
export const TransactionProvider = ({ children }: { children: ReactNode }) => {
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);
  const [transactionCount, setTransactionCount] = useState(0);

  // Log transaction to database for analytics
  const logTransactionToDb = useCallback(async (transaction: Transaction) => {
    try {
      await supabase.from('transaction_logs').insert({
        transaction_id: transaction.id,
        transaction_name: transaction.name,
        status: transaction.status,
        start_time: transaction.startTime.toISOString(),
        end_time: transaction.endTime?.toISOString(),
        result: transaction.result ? JSON.stringify(transaction.result) : null,
        error: transaction.error ? JSON.stringify(transaction.error) : null,
        description: transaction.description,
        metadata: transaction.metadata
      });
    } catch (error) {
      console.error('Failed to log transaction:', error);
    }
  }, []);

  // Start a new transaction
  const startTransaction = useCallback((name: string, options: TransactionOptions = {}) => {
    const { description, metadata, showToast = true } = options;
    
    // Create a new transaction object
    const transaction: Transaction = {
      id: crypto.randomUUID(),
      name,
      status: TRANSACTION_STATUS.PENDING,
      startTime: new Date(),
      description,
      metadata
    };
    
    // Update state
    setCurrentTransaction(transaction);
    setTransactionCount(prev => prev + 1);
    
    // Show toast if enabled
    if (showToast) {
      toast.loading(`Processing ${name}...`, {
        id: `transaction-${transaction.id}`,
        description
      });
    }
    
    return transaction;
  }, []);

  // Complete a transaction successfully
  const completeTransaction = useCallback((id: string, result: any) => {
    setCurrentTransaction(prev => {
      if (!prev || prev.id !== id) return prev;
      
      const updatedTransaction: Transaction = {
        ...prev,
        status: TRANSACTION_STATUS.SUCCESS,
        endTime: new Date(),
        result
      };
      
      // Log successful transaction
      logTransactionToDb(updatedTransaction);
      
      return updatedTransaction;
    });
  }, [logTransactionToDb]);

  // Fail a transaction
  const failTransaction = useCallback((id: string, error: any) => {
    setCurrentTransaction(prev => {
      if (!prev || prev.id !== id) return prev;
      
      const updatedTransaction: Transaction = {
        ...prev,
        status: TRANSACTION_STATUS.ERROR,
        endTime: new Date(),
        error
      };
      
      // Log failed transaction
      logTransactionToDb(updatedTransaction);
      
      return updatedTransaction;
    });
  }, [logTransactionToDb]);

  // Reset a transaction
  const resetTransaction = useCallback((id: string) => {
    setCurrentTransaction(null);
  }, []);

  // Context value
  const contextValue = {
    currentTransaction,
    transactionCount,
    startTransaction,
    completeTransaction,
    failTransaction,
    resetTransaction
  };

  return (
    <TransactionContext.Provider value={contextValue}>
      {children}
    </TransactionContext.Provider>
  );
};
