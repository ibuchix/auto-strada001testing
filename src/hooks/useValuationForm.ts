
/**
 * Changes made:
 * - 2024-09-27: Added RouterGuard to ensure useNavigate is only used within Router context
 * - 2024-09-27: Fixed syntax errors in NavigationHandler implementation
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getValuation } from '../components/hero/valuation/services/valuationService';
import { toast } from 'sonner';
import { ValuationData } from '../components/hero/valuation/types';
import { ValuationFormData } from '@/types/validation';
import { RouterGuard } from '@/components/RouterGuard';

export const useValuationForm = (context: 'home' | 'seller' = 'home') => {
  // These hooks should only run inside RouterGuard
  const [isLoading, setIsLoading] = useState(false);
  const [valuationResult, setValuationResult] = useState<ValuationData | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Create a wrapper component to safely use the router hooks
  const NavigationHandler = ({ onContinue }: { onContinue: () => void }) => {
    const navigate = useNavigate();
    
    const handleContinueWithNavigation = () => {
      setDialogOpen(false);
      if (context === 'seller') {
        navigate('/sell-my-car', { 
          state: { 
            fromValuation: true,
            valuationData: valuationResult 
          } 
        });
      }
      if (onContinue) onContinue();
    };
    
    return (
      <button style={{ display: 'none' }} onClick={handleContinueWithNavigation} />
    );
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
    // This will be handled by the NavigationHandler component
    // The actual navigation logic is inside NavigationHandler
    setDialogOpen(false);
  };

  return {
    isLoading,
    valuationResult,
    dialogOpen,
    handleVinSubmit,
    handleContinue,
    setDialogOpen,
    NavigationHandler, // Export the component for use in ValuationResult
  };
};
