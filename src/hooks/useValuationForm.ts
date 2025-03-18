
/**
 * Changes made:
 * - 2024-09-27: Added RouterGuard to ensure useNavigate is only used within Router context
 * - 2024-09-27: Fixed syntax errors in NavigationHandler implementation
 * - 2024-09-28: Converted NavigationHandler to a function to avoid JSX in .ts files
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getValuation } from '../components/hero/valuation/services/valuationService';
import { toast } from 'sonner';
import { ValuationData } from '../components/hero/valuation/types';
import { ValuationFormData } from '@/types/validation';
import { RouterGuard } from '@/components/RouterGuard';

// Interface for the navigation handler function
interface NavigationHandlerProps {
  onContinue: () => void;
  navigate: ReturnType<typeof useNavigate>;
  context: 'home' | 'seller';
  setDialogOpen: (open: boolean) => void;
  valuationResult: ValuationData | null;
}

// Function to create a navigation handler
const createNavigationHandler = (props: NavigationHandlerProps) => {
  return () => {
    props.setDialogOpen(false);
    if (props.context === 'seller') {
      props.navigate('/sell-my-car', { 
        state: { 
          fromValuation: true,
          valuationData: props.valuationResult 
        } 
      });
    }
    if (props.onContinue) props.onContinue();
  };
};

export const useValuationForm = (context: 'home' | 'seller' = 'home') => {
  // These hooks should only run inside RouterGuard
  const [isLoading, setIsLoading] = useState(false);
  const [valuationResult, setValuationResult] = useState<ValuationData | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Function to create a navigation handler that works with the Router context
  const getNavigationHandler = (navigate: ReturnType<typeof useNavigate>, onContinue: () => void) => {
    return createNavigationHandler({
      onContinue,
      navigate,
      context,
      setDialogOpen,
      valuationResult
    });
  };

  const handleVinSubmit = async (e: React.FormEvent, formData: ValuationFormData) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await getValuation(
        formData.vin,
        Number(formData.mileage),
        formData.gearbox,
        context
      );
      
      if (result.data.isExisting && context === 'seller') {
        toast.error("This vehicle has already been listed");
        return;
      }

      setValuationResult(result.data);
      setDialogOpen(true);
      
      // Store valuation data in localStorage
      localStorage.setItem('valuationData', JSON.stringify(result.data));
      localStorage.setItem('tempVIN', formData.vin);
      localStorage.setItem('tempMileage', formData.mileage);
      localStorage.setItem('tempGearbox', formData.gearbox);
    } catch (error: any) {
      console.error('Valuation error:', error);
      toast.error(error.message || "Failed to get vehicle valuation");
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    // This will be handled differently now
    setDialogOpen(false);
  };

  return {
    isLoading,
    valuationResult,
    dialogOpen,
    handleVinSubmit,
    handleContinue,
    setDialogOpen,
    getNavigationHandler, // Export the function that creates a navigation handler
  };
};
