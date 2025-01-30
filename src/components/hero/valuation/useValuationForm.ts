import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getValuation } from './services/valuationService';
import { toast } from 'sonner';
import { ValuationResult } from './types';

export const useValuationForm = (context: 'home' | 'seller' = 'home') => {
  const navigate = useNavigate();
  const [vin, setVin] = useState('');
  const [mileage, setMileage] = useState('');
  const [gearbox, setGearbox] = useState<'manual' | 'automatic'>('manual');
  const [isLoading, setIsLoading] = useState(false);
  const [valuationResult, setValuationResult] = useState<ValuationResult | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleVinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await getValuation(vin, Number(mileage), gearbox, context);
      
      if (result.isExisting) {
        toast.error("This vehicle has already been listed");
        return;
      }

      setValuationResult(result);
      setDialogOpen(true);
      
      // Store valuation data in localStorage
      localStorage.setItem('valuationData', JSON.stringify(result));
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
    vin,
    setVin,
    mileage,
    setMileage,
    gearbox,
    setGearbox,
    isLoading,
    valuationResult,
    dialogOpen,
    handleVinSubmit,
    handleContinue,
    setDialogOpen,
  };
};