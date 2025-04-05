/**
 * Valuation state slice for the central store
 * Created: 2025-04-15
 */

import { StateCreator } from 'zustand';
import { ValuationResult } from '@/components/hero/valuation/types';
import { Database } from '@/integrations/supabase/types';

// Define types
type TransmissionType = Database['public']['Enums']['car_transmission_type'];

// Define valuation state
export interface ValuationState {
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

// Define valuation actions
export interface ValuationActions {
  setValuationField: (field: keyof ValuationState, value: any) => void;
  setValuationResult: (result: ValuationResult | null) => void;
  resetValuation: () => void;
}

// Combined valuation slice type
export type ValuationSlice = ValuationState & ValuationActions;

// Initial valuation state
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

// Create the valuation slice
export const createValuationSlice: StateCreator<
  ValuationSlice,
  [["zustand/immer", never]],
  [],
  ValuationSlice
> = (set) => ({
  // Initial state
  ...initialValuationState,
  
  // Actions
  setValuationField: (field, value) => set((state) => {
    state[field] = value;
  }),
  
  setValuationResult: (result) => set((state) => {
    state.valuationResult = result;
    state.error = null;
  }),
  
  resetValuation: () => set((state) => {
    // Keep form values but reset the rest
    const { vin, mileage, gearbox } = state;
    return {
      ...initialValuationState,
      vin,
      mileage,
      gearbox
    };
  })
});
