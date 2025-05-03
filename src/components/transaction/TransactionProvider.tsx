
/**
 * Provider for transaction context and state management
 * - 2025-06-15: Fixed TransactionStatus reference issues
 * - 2025-06-20: Removed diagnostic service references
 * - 2025-06-23: Fixed TransactionStatus enum usage
 */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { toast } from 'sonner';
import { TransactionStatus } from '@/services/supabase/transactions/types';

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

  // Start a new transaction
  const startTransaction = useCallback((name: string, options: TransactionOptions = {}) => {
    const { description, metadata, showToast = true } = options;
    
    // Create a new transaction object
    const transaction: Transaction = {
      id: crypto.randomUUID(),
      name,
      status: TransactionStatus.PENDING,
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
        status: TransactionStatus.SUCCESS,
        endTime: new Date(),
        result
      };
      
      // Log to console instead of database for now
      console.log('Transaction completed successfully:', updatedTransaction);
      
      return updatedTransaction;
    });
  }, []);

  // Fail a transaction
  const failTransaction = useCallback((id: string, error: any) => {
    setCurrentTransaction(prev => {
      if (!prev || prev.id !== id) return prev;
      
      const updatedTransaction: Transaction = {
        ...prev,
        status: TransactionStatus.ERROR,
        endTime: new Date(),
        error
      };
      
      // Log to console instead of database for now
      console.error('Transaction failed:', updatedTransaction);
      
      return updatedTransaction;
    });
  }, []);

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
