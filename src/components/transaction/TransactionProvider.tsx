
/**
 * Updated: 2025-08-27
 * Fixed TransactionProvider to include required properties in transaction object
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
        type,
        name: operation, // Add name property
        status: TransactionStatus.PENDING,
        startTime: new Date().toISOString(), // Convert Date to string
        steps: [] // Add empty steps array
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
              error: error?.message || 'Unknown error'
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
