
/**
 * Centralized store implementation
 * Created: 2025-04-09
 * Updated: 2025-04-15 - Refactored into separate slice files
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import { 
  ErrorSlice, 
  createErrorSlice 
} from './slices/errorSlice';
import { 
  TransactionSlice, 
  createTransactionSlice 
} from './slices/transactionSlice';
import { 
  ValuationSlice, 
  createValuationSlice 
} from './slices/valuationSlice';

// Combined store interface
export type StoreState = ErrorSlice & TransactionSlice & ValuationSlice;

// Re-export types from slices
export type { TransactionStatus, Transaction } from './slices/transactionSlice';

// Create the store with immer for easy state updates and persist for local storage
export const useStore = create<StoreState>()(
  persist(
    immer((...a) => ({
      // Combine all slices
      ...createErrorSlice(...a),
      ...createTransactionSlice(...a),
      ...createValuationSlice(...a),
    })),
    {
      name: 'autostrada-store',
      // Only persist certain parts of the store
      partialize: (state) => ({
        valuation: {
          vin: state.vin,
          mileage: state.mileage,
          gearbox: state.gearbox,
          valuationResult: state.valuationResult
        }
      })
    }
  )
);
