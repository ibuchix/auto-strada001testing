
/**
 * Changes made:
 * - 2024-10-16: Created Transaction Provider component to track and manage critical operations
 */

import { createContext, useContext, ReactNode, useState, useCallback } from "react";
import { TransactionDetails, TransactionStatus, TransactionType } from "@/services/supabase/transactionService";
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
    onSuccess: (_, details) => {
      addToHistory(details);
      setCurrentTransaction(null);
    },
    onError: (_, details) => {
      addToHistory(details);
      setCurrentTransaction(null);
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
        startTime: new Date()
      };
      
      setCurrentTransaction(placeholderTransaction);
      
      return executeTransaction(
        operation,
        type,
        callback,
        options
      );
    },
    [executeTransaction]
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
