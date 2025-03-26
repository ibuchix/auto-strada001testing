
/**
 * Changes made:
 * - 2024-10-16: Created Transaction Provider component to track and manage critical operations
 * - 2024-10-24: Fixed type issues with callback functions
 * - 2024-10-25: Aligned callback parameter counts with updated transaction hooks
 * - 2024-07-24: Fixed Date to string type conversions for transaction timestamps
 * - 2024-08-04: Fixed TransactionType import to use transactions/types
 */

import { createContext, useContext, ReactNode, useState, useCallback } from "react";
import { TransactionDetails, TransactionStatus, TransactionType } from "@/services/supabase/transactions/types";
import { useTransaction } from "@/hooks/useTransaction";

interface TransactionContextType {
  executeTransaction: <T>(
    operation: string,
    type: TransactionType,
    callback: () => Promise<T>,
    options?: any
  ) => Promise<T | null>;
  isLoading: boolean;
  currentTransaction: TransactionDetails | null;
  transactionHistory: TransactionDetails[];
  clearHistory: () => void;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

interface TransactionProviderProps {
  children: ReactNode;
  maxHistoryLength?: number;
}

export const TransactionProvider = ({
  children,
  maxHistoryLength = 10
}: TransactionProviderProps) => {
  const [transactionHistory, setTransactionHistory] = useState<TransactionDetails[]>([]);
  const [currentTransaction, setCurrentTransaction] = useState<TransactionDetails | null>(null);
  
  const { executeTransaction, isLoading } = useTransaction({
    onSuccess: (result: any) => {
      // This type enforces compatibility with the TransactionOptions interface
      // We'll get transaction details from the history instead
    },
    onError: (error: any) => {
      // This type enforces compatibility with the TransactionOptions interface
      // We'll get transaction details from the history instead
    }
  });

  const addToHistory = useCallback((details: TransactionDetails) => {
    setTransactionHistory(prev => {
      const updated = [details, ...prev].slice(0, maxHistoryLength);
      return updated;
    });
  }, [maxHistoryLength]);

  const wrappedExecuteTransaction = useCallback(
    async <T,>(
      operation: string,
      type: TransactionType,
      callback: () => Promise<T>,
      options?: any
    ) => {
      // Create a placeholder transaction for UI updates
      const placeholderTransaction: TransactionDetails = {
        id: crypto.randomUUID(),
        operation,
        type,
        status: TransactionStatus.PENDING,
        startTime: new Date().toISOString() // Convert Date to string
      };
      
      setCurrentTransaction(placeholderTransaction);
      
      return executeTransaction(
        operation,
        type as any, // Type assertion to handle TransactionType compatibility
        callback,
        {
          ...options,
          onSuccess: (result: any) => {
            if (options?.onSuccess) {
              options.onSuccess(result);
            }
            
            // Update transaction history
            const completedTransaction: TransactionDetails = {
              ...placeholderTransaction,
              status: TransactionStatus.SUCCESS,
              endTime: new Date().toISOString() // Convert Date to string
            };
            addToHistory(completedTransaction);
            setCurrentTransaction(null);
          },
          onError: (error: any) => {
            if (options?.onError) {
              options.onError(error);
            }
            
            // Update transaction history
            const failedTransaction: TransactionDetails = {
              ...placeholderTransaction,
              status: TransactionStatus.ERROR,
              endTime: new Date().toISOString(), // Convert Date to string
              errorDetails: error?.message || 'Unknown error'
            };
            addToHistory(failedTransaction);
            setCurrentTransaction(null);
          }
        }
      );
    },
    [executeTransaction, addToHistory]
  );

  const clearHistory = useCallback(() => {
    setTransactionHistory([]);
  }, []);

  const value = {
    executeTransaction: wrappedExecuteTransaction,
    isLoading,
    currentTransaction,
    transactionHistory,
    clearHistory
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactionContext = () => {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error("useTransactionContext must be used within a TransactionProvider");
  }
  return context;
};
