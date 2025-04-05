/**
 * Centralized store implementation
 * Created: 2025-04-09
 * 
 * This implements a single source of truth for application data
 * and consolidates previously scattered state management.
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import { AppError } from '@/errors/classes';
import { ErrorCategory, ErrorCode } from '@/errors/types';
import { ValuationResult } from '@/components/hero/valuation/types';
import { Database } from '@/integrations/supabase/types';

// Define types for our store
type TransmissionType = Database['public']['Enums']['car_transmission_type'];

// ======== VALUATION STATE ========
interface ValuationState {
  // Form state
  vin: string;
  mileage: string;
  gearbox: TransmissionType;
  
  // UI state
  isLoading: boolean;
  dialogOpen: boolean;
  showManualForm: boolean;
  
  // Result state
  valuationResult: ValuationResult | null;
  
  // Error handling
  error: Error | string | null;
  retryCount: number;
}

// ======== ERROR STATE ========
interface ErrorState {
  errors: AppError[];
  lastError: AppError | null;
}

// ======== TRANSACTION STATE ========
export type TransactionStatus = 'idle' | 'pending' | 'success' | 'error' | 'cancelled';

interface Transaction {
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

interface TransactionState {
  currentTransaction: Transaction | null;
  transactionCount: number;
  transactions: Transaction[];
}

// ======== COMBINED STORE INTERFACE ========
interface StoreState {
  // Valuation state
  valuation: ValuationState;
  
  // Error state
  errors: ErrorState;
  
  // Transaction state
  transactions: TransactionState;
  
  // Valuation actions
  setValuationField: (field: keyof ValuationState, value: any) => void;
  setValuationResult: (result: ValuationResult | null) => void;
  resetValuation: () => void;
  
  // Error actions
  addError: (error: AppError) => void;
  clearErrors: () => void;
  clearError: (id: string) => void;
  captureError: (error: unknown) => AppError;
  
  // Transaction actions
  startTransaction: (name: string, options?: {
    description?: string;
    metadata?: Record<string, any>;
    showToast?: boolean;
  }) => Transaction;
  completeTransaction: (id: string, result: any) => void;
  failTransaction: (id: string, error: any) => void;
  resetTransaction: (id: string) => void;
}

// Initial state
const initialValuationState: ValuationState = {
  vin: "",
  mileage: "",
  gearbox: "manual",
  isLoading: false,
  dialogOpen: false,
  showManualForm: false,
  valuationResult: null,
  error: null,
  retryCount: 0
};

const initialErrorState: ErrorState = {
  errors: [],
  lastError: null
};

const initialTransactionState: TransactionState = {
  currentTransaction: null,
  transactionCount: 0,
  transactions: []
};

// Create the store with immer for easy state updates and persist for local storage
export const useStore = create<StoreState>()(
  persist(
    immer((set, get) => ({
      // State
      valuation: initialValuationState,
      errors: initialErrorState,
      transactions: initialTransactionState,
      
      // Valuation actions
      setValuationField: (field, value) => set(state => {
        state.valuation[field] = value;
      }),
      
      setValuationResult: (result) => set(state => {
        state.valuation.valuationResult = result;
        state.valuation.error = null;
      }),
      
      resetValuation: () => set(state => {
        // Keep form values but reset the rest
        const { vin, mileage, gearbox } = state.valuation;
        state.valuation = {
          ...initialValuationState,
          vin,
          mileage,
          gearbox
        };
      }),
      
      // Error actions
      addError: (error) => set(state => {
        state.errors.errors = [error, ...state.errors.errors];
        state.errors.lastError = error;
      }),
      
      clearErrors: () => set(state => {
        state.errors.errors = [];
        state.errors.lastError = null;
      }),
      
      clearError: (id) => set(state => {
        state.errors.errors = state.errors.errors.filter(error => error.id !== id);
        if (state.errors.lastError?.id === id) {
          state.errors.lastError = null;
        }
      }),
      
      captureError: (errorData) => {
        let appError: AppError;
        
        if (errorData instanceof AppError) {
          appError = errorData;
        } else if (errorData instanceof Error) {
          appError = new AppError({
            message: errorData.message,
            code: ErrorCode.UNKNOWN_ERROR,
            category: ErrorCategory.UNKNOWN,
            metadata: {
              originalError: errorData,
              details: { stack: errorData.stack }
            }
          });
        } else {
          appError = new AppError({
            message: String(errorData || 'Unknown error'),
            code: ErrorCode.UNKNOWN_ERROR,
            category: ErrorCategory.UNKNOWN
          });
        }
        
        // Generate a unique ID if needed
        const errorWithId = appError.id ? appError : new AppError({
          ...appError.serialize(),
          id: crypto.randomUUID()
        });
        
        get().addError(errorWithId);
        return errorWithId;
      },
      
      // Transaction actions
      startTransaction: (name, options = {}) => {
        const { description, metadata, showToast = true } = options;
        
        const transaction: Transaction = {
          id: crypto.randomUUID(),
          name,
          status: 'pending',
          startTime: new Date(),
          description,
          metadata
        };
        
        set(state => {
          state.transactions.currentTransaction = transaction;
          state.transactions.transactionCount += 1;
          state.transactions.transactions.push(transaction);
        });
        
        // Toast logic would be handled by hooks using this store
        
        return transaction;
      },
      
      completeTransaction: (id, result) => set(state => {
        const transactionIndex = state.transactions.transactions.findIndex(t => t.id === id);
        if (transactionIndex >= 0) {
          state.transactions.transactions[transactionIndex].status = 'success';
          state.transactions.transactions[transactionIndex].endTime = new Date();
          state.transactions.transactions[transactionIndex].result = result;
          
          if (state.transactions.currentTransaction?.id === id) {
            state.transactions.currentTransaction = state.transactions.transactions[transactionIndex];
          }
        }
      }),
      
      failTransaction: (id, error) => set(state => {
        const transactionIndex = state.transactions.transactions.findIndex(t => t.id === id);
        if (transactionIndex >= 0) {
          state.transactions.transactions[transactionIndex].status = 'error';
          state.transactions.transactions[transactionIndex].endTime = new Date();
          state.transactions.transactions[transactionIndex].error = error;
          
          if (state.transactions.currentTransaction?.id === id) {
            state.transactions.currentTransaction = state.transactions.transactions[transactionIndex];
          }
        }
      }),
      
      resetTransaction: (id) => set(state => {
        if (state.transactions.currentTransaction?.id === id) {
          state.transactions.currentTransaction = null;
        }
      })
    })),
    {
      name: 'autostrada-store',
      // Only persist certain parts of the store
      partialize: (state) => ({
        valuation: {
          vin: state.valuation.vin,
          mileage: state.valuation.mileage,
          gearbox: state.valuation.gearbox,
          valuationResult: state.valuation.valuationResult
        }
      })
    }
  )
);
