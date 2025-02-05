import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getValuation } from './services/valuationService';
import { toast } from 'sonner';
import { ValuationData } from './types';
import { ValuationFormData } from '@/types/validation';

export const useValuationForm = (context: 'home' | 'seller' = 'home') => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [valuationResult, setValuationResult] = useState<ValuationData | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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
    setDialogOpen(false);
    if (context === 'seller') {
      navigate('/sell-my-car', { 
        state: { 
          fromValuation: true,
          valuationData: valuationResult 
        } 
      });
    }
  };

  return {
    isLoading,
    valuationResult,
    dialogOpen,
    handleVinSubmit,
    handleContinue,
    setDialogOpen,
  };
};