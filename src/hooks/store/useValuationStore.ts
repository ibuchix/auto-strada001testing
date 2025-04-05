
/**
 * Hooks for accessing valuation state from the central store
 * Created: 2025-04-09
 * Updated: 2025-04-15 - Updated to use refactored store
 */

import { useStore } from '@/store';
import { toast } from 'sonner';
import { useCallback } from 'react';
import { ValuationFormData } from '@/types/validation';
import { getValuation, cleanupValuationData } from '@/components/hero/valuation/services/valuationService';

// A specialized hook for valuation operations
export const useValuationStore = () => {
  // Extract valuation-related parts from the store
  const vin = useStore(state => state.vin);
  const mileage = useStore(state => state.mileage);
  const gearbox = useStore(state => state.gearbox);
  const isLoading = useStore(state => state.isLoading);
  const dialogOpen = useStore(state => state.dialogOpen);
  const showManualForm = useStore(state => state.showManualForm);
  const valuationResult = useStore(state => state.valuationResult);
  const retryCount = useStore(state => state.retryCount);
  const error = useStore(state => state.error);
  
  // Actions
  const setValuationField = useStore(state => state.setValuationField);
  const setValuationResult = useStore(state => state.setValuationResult);
  const resetValuation = useStore(state => state.resetValuation);
  const captureError = useStore(state => state.captureError);

  // Helper setters
  const setVin = useCallback((value: string) => {
    setValuationField('vin', value);
  }, [setValuationField]);

  const setMileage = useCallback((value: string) => {
    setValuationField('mileage', value);
  }, [setValuationField]);

  const setGearbox = useCallback((value: any) => {
    setValuationField('gearbox', value);
  }, [setValuationField]);

  const setIsLoading = useCallback((value: boolean) => {
    setValuationField('isLoading', value);
  }, [setValuationField]);

  const setDialogOpen = useCallback((value: boolean) => {
    setValuationField('dialogOpen', value);
  }, [setValuationField]);

  const setShowManualForm = useCallback((value: boolean) => {
    setValuationField('showManualForm', value);
  }, [setValuationField]);

  const setError = useCallback((error: Error | string | null) => {
    setValuationField('error', error);
  }, [setValuationField]);

  const incrementRetryCount = useCallback(() => {
    setValuationField('retryCount', retryCount + 1);
    
    // After multiple retries, suggest manual valuation
    if (retryCount + 1 >= 3) {
      toast.info("Having trouble with automatic valuation?", {
        description: "You might want to try manual valuation instead.",
        duration: 5000
      });
    }
  }, [retryCount, setValuationField]);

  const resetRetryCount = useCallback(() => {
    setValuationField('retryCount', 0);
  }, [setValuationField]);

  const resetForm = useCallback(() => {
    setVin('');
    setMileage('');
    setGearbox('manual');
  }, [setVin, setMileage, setGearbox]);

  const resetState = useCallback(() => {
    resetValuation();
    cleanupValuationData();
  }, [resetValuation]);

  // Business logic - Valuation submission
  const handleVinSubmit = async (e: React.FormEvent, formData: ValuationFormData) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const result = await getValuation(
        formData.vin,
        Number(formData.mileage),
        formData.gearbox
      );
      
      if (result.data.isExisting) {
        toast.error("This vehicle has already been listed");
        return;
      }

      setValuationResult(result.data);
      setDialogOpen(true);
      
      // Store valuation data in localStorage (still useful for compatibility)
      localStorage.setItem('valuationData', JSON.stringify(result.data));
      localStorage.setItem('tempVIN', formData.vin);
      localStorage.setItem('tempMileage', formData.mileage);
      localStorage.setItem('tempGearbox', formData.gearbox);
    } catch (error: any) {
      console.error('Valuation error:', error);
      setError(error.message || "Failed to get vehicle valuation");
      captureError(error);
      toast.error(error.message || "Failed to get vehicle valuation");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    // State
    vin,
    mileage,
    gearbox,
    isLoading,
    dialogOpen,
    showDialog: dialogOpen, // Alias for backward compatibility
    showManualForm,
    valuationResult,
    error,
    retryCount,
    
    // Setters
    setVin,
    setMileage,
    setGearbox,
    setIsLoading,
    setDialogOpen,
    setShowDialog: setDialogOpen, // Alias
    setShowManualForm,
    setValuationResult,
    setError,
    
    // Actions
    handleVinSubmit,
    incrementRetryCount,
    resetRetryCount,
    resetState,
    resetForm
  };
};
