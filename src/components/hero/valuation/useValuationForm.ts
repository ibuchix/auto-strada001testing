
/**
 * Changes made:
 * - 2025-04-05: Completely refactored to use centralized state management
 * - Removed redundant state tracking and simplified the submission flow
 * - Improved error handling with clear responsibilities
 */

import { useNavigate } from 'react-router-dom';
import { getValuation } from './services/valuationService';
import { toast } from 'sonner';
import { ValuationFormData } from '@/types/validation';
import { useValuationState } from '@/hooks/valuation/useValuationState';

export const useValuationForm = (context: 'home' | 'seller' = 'home') => {
  const navigate = useNavigate();
  const valuationState = useValuationState();
  
  const handleVinSubmit = async (e: React.FormEvent, formData: ValuationFormData) => {
    e.preventDefault();
    valuationState.setIsLoading(true);
    
    try {
      const result = await getValuation(
        formData.vin,
        Number(formData.mileage),
        formData.gearbox
      );
      
      if (result.data.isExisting && context === 'seller') {
        toast.error("This vehicle has already been listed");
        return;
      }

      valuationState.setValuationResult(result.data);
      valuationState.setDialogOpen(true);
      
      // Store valuation data in localStorage (single source of truth)
      localStorage.setItem('valuationData', JSON.stringify(result.data));
      localStorage.setItem('tempVIN', formData.vin);
      localStorage.setItem('tempMileage', formData.mileage);
      localStorage.setItem('tempGearbox', formData.gearbox);
    } catch (error: any) {
      console.error('Valuation error:', error);
      valuationState.setError(error.message || "Failed to get vehicle valuation");
      toast.error(error.message || "Failed to get vehicle valuation");
    } finally {
      valuationState.setIsLoading(false);
    }
  };

  const handleContinue = () => {
    valuationState.setDialogOpen(false);
    if (context === 'seller') {
      navigate('/sell-my-car', { 
        state: { 
          fromValuation: true,
          valuationData: valuationState.valuationResult 
        } 
      });
    }
  };

  return {
    // Pass through the state
    vin: valuationState.vin,
    mileage: valuationState.mileage,
    gearbox: valuationState.gearbox,
    isLoading: valuationState.isLoading,
    valuationResult: valuationState.valuationResult,
    dialogOpen: valuationState.dialogOpen,
    showManualForm: valuationState.showManualForm,
    
    // Pass through the setters
    setVin: valuationState.setVin,
    setMileage: valuationState.setMileage,
    setGearbox: valuationState.setGearbox,
    setDialogOpen: valuationState.setDialogOpen,
    setShowManualForm: valuationState.setShowManualForm,
    
    // Form handlers
    handleVinSubmit,
    handleContinue,
    
    // Reset functions
    resetState: valuationState.resetState
  };
};
