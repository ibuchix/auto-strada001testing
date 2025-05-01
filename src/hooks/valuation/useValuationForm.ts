
/**
 * Hook for valuation form functionality
 * Updated: 2025-05-01 - Updated to use centralized reserve price calculator
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { getVehicleValuation } from '@/services/api/valuationService';
import { toast } from 'sonner';
import { calculateReservePrice } from '@/utils/valuation/reservePriceCalculator';
import { extractNestedPriceData, calculateBasePriceFromNested } from '@/utils/extraction/pricePathExtractor';

// Form schema
const valuationFormSchema = z.object({
  vin: z.string().min(5, { message: 'VIN must be at least 5 characters' }).max(17),
  mileage: z.string().transform(val => parseInt(val) || 0),
  gearbox: z.enum(['manual', 'automatic']).default('manual'),
});

type ValuationFormValues = z.infer<typeof valuationFormSchema>;

export function useValuationForm() {
  const [valuationResult, setValuationResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  const form = useForm<ValuationFormValues>({
    resolver: zodResolver(valuationFormSchema),
    defaultValues: {
      vin: '',
      mileage: '0',
      gearbox: 'manual'
    },
  });

  const onSubmit = async (data: ValuationFormValues) => {
    setIsLoading(true);
    
    try {
      const { success, data: valuationData, error } = await getVehicleValuation(
        data.vin,
        parseInt(data.mileage.toString()),
        data.gearbox
      );

      if (success && valuationData) {
        console.log('Valuation data received:', valuationData);
        
        // Extract nested price data and calculate base price
        const priceData = extractNestedPriceData(valuationData);
        const basePrice = calculateBasePriceFromNested(priceData);
        
        // Calculate reserve price using the centralized utility
        const reservePrice = valuationData.reservePrice || calculateReservePrice(basePrice);
        
        // Create normalized result
        const result = {
          ...valuationData,
          vin: data.vin,
          mileage: parseInt(data.mileage.toString()),
          transmission: data.gearbox,
          reservePrice,
          basePrice
        };
        
        setValuationResult(result);
        setShowDialog(true);
      } else {
        console.error('Valuation error:', error);
        toast.error('Failed to get valuation. Please try again.');
      }
    } catch (error) {
      console.error('Exception in valuation:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    form.reset();
    setValuationResult(null);
    setShowDialog(false);
  };

  return {
    form,
    isLoading,
    showDialog,
    setShowDialog,
    valuationResult,
    onSubmit,
    resetForm
  };
}
