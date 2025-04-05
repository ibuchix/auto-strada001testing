
/**
 * Changes made:
 * - 2025-04-05: Completely refactored to use centralized state management
 * - Removed redundant state tracking and simplified the submission flow
 * - Improved error handling with clear responsibilities
 * - 2025-04-09: Updated to use the new central store via hooks
 */

import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ValuationFormData } from '@/types/validation';
import { useValuationStore } from '@/hooks/store/useValuationStore';

export const useValuationForm = (context: 'home' | 'seller' = 'home') => {
  const navigate = useNavigate();
  const valuationState = useValuationStore();
  
  const handleVinSubmit = async (e: React.FormEvent, formData: ValuationFormData) => {
    // Use the method from our central store
    await valuationState.handleVinSubmit(e, formData);
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
