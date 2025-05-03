
/**
 * Hook for valuation functionality in Hero component
 * Created: 2025-05-03
 * Purpose: Handle valuation state and API calls in the hero section
 */

import { useState } from 'react';
import { ValuationResult } from '@/types/valuation';
import { useError } from '@/hooks/useError';
import { toast } from 'sonner';

export interface ValuationState {
  isLoading: boolean;
  result: ValuationResult | null;
  error: Error | null;
  showModal: boolean;
}

export const useValuation = () => {
  const [state, setState] = useState<ValuationState>({
    isLoading: false,
    result: null,
    error: null,
    showModal: false
  });

  const { captureError } = useError();

  const setValuationResult = (result: ValuationResult | null) => {
    setState(prev => ({
      ...prev,
      result,
      showModal: !!result,
      isLoading: false
    }));
  };

  const handleValuationError = (error: any) => {
    console.error('Valuation error:', error);
    const errorObj = error instanceof Error ? error : new Error(error.toString());
    
    setState(prev => ({
      ...prev,
      error: errorObj,
      isLoading: false
    }));

    captureError(errorObj);
    toast.error('Valuation failed', { 
      description: errorObj.message || 'Failed to get vehicle valuation'
    });
  };

  const startLoading = () => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null
    }));
  };

  const stopLoading = () => {
    setState(prev => ({
      ...prev,
      isLoading: false
    }));
  };

  const closeModal = () => {
    setState(prev => ({
      ...prev,
      showModal: false
    }));
  };

  const resetValuation = () => {
    setState({
      isLoading: false,
      result: null,
      error: null,
      showModal: false
    });
  };

  return {
    ...state,
    setValuationResult,
    handleValuationError,
    startLoading,
    stopLoading,
    closeModal,
    resetValuation
  };
};
