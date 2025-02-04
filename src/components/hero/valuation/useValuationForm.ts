
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getValuation } from './services/valuationService';
import { toast } from 'sonner';
import { ValuationResult, ValuationData } from './types';
import { Database } from '@/integrations/supabase/types';

type TransmissionType = Database['public']['Enums']['car_transmission_type'];

export const useValuationForm = (context: 'home' | 'seller' = 'home') => {
  const navigate = useNavigate();
  const [vin, setVin] = useState('');
  const [mileage, setMileage] = useState('');
  const [gearbox, setGearbox] = useState<TransmissionType>('manual');
  const [isLoading, setIsLoading] = useState(false);
  const [valuationResult, setValuationResult] = useState<ValuationData | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleVinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await getValuation(vin, Number(mileage), gearbox, context);
      
      if (result.data.isExisting && context === 'seller') {
        toast.error("This vehicle has already been listed");
        return;
      }

      setValuationResult(result.data);
      setDialogOpen(true);
      
      // Store valuation data in localStorage
      localStorage.setItem('valuationData', JSON.stringify(result.data));
      localStorage.setItem('tempVIN', vin);
      localStorage.setItem('tempMileage', mileage);
      localStorage.setItem('tempGearbox', gearbox);
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
