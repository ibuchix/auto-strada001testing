
/**
 * Transaction state slice for the central store
 * Created: 2025-04-15
 */

import { StateCreator } from 'zustand';

// Define transaction status type
export type TransactionStatus = 'idle' | 'pending' | 'success' | 'error' | 'cancelled';

// Define transaction interface
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

// Define transaction state
export interface TransactionState {
  currentTransaction: Transaction | null;
  transactionCount: number;
  transactions: Transaction[];
}

// Define transaction actions
export interface TransactionActions {
  startTransaction: (name: string, options?: {
    description?: string;
    metadata?: Record<string, any>;
    showToast?: boolean;
  }) => Transaction;
  completeTransaction: (id: string, result: any) => void;
  failTransaction: (id: string, error: any) => void;
  resetTransaction: (id: string) => void;
}

// Combined transaction slice type
export type TransactionSlice = TransactionState & TransactionActions;

// Create the transaction slice
export const createTransactionSlice: StateCreator<
  TransactionSlice,
  [["zustand/immer", never]],
  [],
  TransactionSlice
> = (set, get) => ({
  // Initial state
  currentTransaction: null,
  transactionCount: 0,
  transactions: [],

  // Actions
  startTransaction: (name, options = {}) => {
    const transaction: Transaction = {
      id: crypto.randomUUID(),
      name,
      status: 'pending',
      startTime: new Date(),
      description: options.description,
      metadata: options.metadata
    };
    
    set((state) => {
      state.currentTransaction = transaction;
      state.transactionCount += 1;
      state.transactions.push(transaction);
    });
    
    return transaction;
  },
  
  completeTransaction: (id, result) => set((state) => {
    const transactionIndex = state.transactions.findIndex(t => t.id === id);
    if (transactionIndex >= 0) {
      state.transactions[transactionIndex].status = 'success';
      state.transactions[transactionIndex].endTime = new Date();
      state.transactions[transactionIndex].result = result;
      
      if (state.currentTransaction?.id === id) {
        state.currentTransaction = state.transactions[transactionIndex];
      }
    }
  }),
  
  failTransaction: (id, error) => set((state) => {
    const transactionIndex = state.transactions.findIndex(t => t.id === id);
    if (transactionIndex >= 0) {
      state.transactions[transactionIndex].status = 'error';
      state.transactions[transactionIndex].endTime = new Date();
      state.transactions[transactionIndex].error = error;
      
      if (state.currentTransaction?.id === id) {
        state.currentTransaction = state.transactions[transactionIndex];
      }
    }
  }),
  
  resetTransaction: (id) => set((state) => {
    if (state.currentTransaction?.id === id) {
      state.currentTransaction = null;
    }
  })
});
