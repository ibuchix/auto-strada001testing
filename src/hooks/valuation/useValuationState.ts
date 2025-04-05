/**
 * Changes made:
 * - 2025-04-05: Completely rewritten for centralized state management
 * - Combined functionality from multiple separate state hooks
 * - Eliminated redundant state tracking
 * - Simplified loading and error states
 */

import { useState, useCallback } from "react";
import { ValuationResult } from "@/components/hero/valuation/types";
import { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { cleanupValuationData } from "@/components/hero/valuation/services/valuationService";

type TransmissionType = Database['public']['Enums']['car_transmission_type'];

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

const initialState: ValuationState = {
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

export const useValuationState = (customInitialState?: Partial<ValuationState>) => {
  const [state, setState] = useState<ValuationState>({
    ...initialState,
    ...customInitialState
  });
  
  // Form value setters
  const setVin = useCallback((vin: string) => {
    setState(prev => ({ ...prev, vin }));
  }, []);
  
  const setMileage = useCallback((mileage: string) => {
    setState(prev => ({ ...prev, mileage }));
  }, []);
  
  const setGearbox = useCallback((gearbox: TransmissionType) => {
    setState(prev => ({ ...prev, gearbox }));
  }, []);
  
  // UI state setters
  const setIsLoading = useCallback((isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading }));
  }, []);
  
  const setDialogOpen = useCallback((dialogOpen: boolean) => {
    setState(prev => ({ ...prev, dialogOpen }));
  }, []);
  
  const setShowManualForm = useCallback((showManualForm: boolean) => {
    setState(prev => ({ ...prev, showManualForm }));
  }, []);
  
  // Result state setters
  const setValuationResult = useCallback((valuationResult: ValuationResult | null) => {
    setState(prev => ({ ...prev, valuationResult, error: null }));
  }, []);
  
  // Error handling
  const setError = useCallback((error: Error | string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);
  
  const incrementRetryCount = useCallback(() => {
    setState(prev => {
      const newCount = prev.retryCount + 1;
      
      // After multiple retries, suggest manual valuation
      if (newCount >= 3) {
        toast.info("Having trouble with automatic valuation?", {
          description: "You might want to try manual valuation instead.",
          duration: 5000
        });
      }
      
      return { ...prev, retryCount: newCount };
    });
  }, []);
  
  const resetRetryCount = useCallback(() => {
    setState(prev => ({ ...prev, retryCount: 0 }));
  }, []);
  
  // Complete state reset
  const resetState = useCallback(() => {
    setState(prev => ({
      ...initialState,
      // Keep form values for convenience
      vin: prev.vin,
      mileage: prev.mileage,
      gearbox: prev.gearbox
    }));
    cleanupValuationData();
  }, []);
  
  // Form reset
  const resetForm = useCallback(() => {
    setState(prev => ({
      ...prev,
      vin: "",
      mileage: "",
      gearbox: "manual"
    }));
  }, []);
  
  return {
    // State
    ...state,
    
    // Setters
    setVin,
    setMileage,
    setGearbox,
    setIsLoading,
    setDialogOpen,
    setShowManualForm,
    setValuationResult,
    setError,
    
    // Action methods
    incrementRetryCount,
    resetRetryCount,
    resetState,
    resetForm
  };
};
