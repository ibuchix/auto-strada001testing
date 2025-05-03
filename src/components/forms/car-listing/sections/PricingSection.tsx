
/**
 * PricingSection component
 * Created: 2025-07-18
 */

import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CarListingFormData } from '@/types/forms';
import { useState, useEffect } from 'react';

export const PricingSection = () => {
  const { register, setValue, watch } = useFormContext<CarListingFormData>();
  const price = watch('price');
  const [reservePrice, setReservePrice] = useState<number | undefined>(undefined);
  
  // Calculate reserve price based on listed price
  useEffect(() => {
    if (!price) return;
    
    // Convert to number for calculation
    const priceNum = Number(price);
    if (isNaN(priceNum) || priceNum <= 0) return;
    
    // Determine percentage based on price range
    let percentageY;
    
    if (priceNum <= 15000) percentageY = 0.65;
    else if (priceNum <= 20000) percentageY = 0.46;
    else if (priceNum <= 30000) percentageY = 0.37;
    else if (priceNum <= 50000) percentageY = 0.27;
    else if (priceNum <= 60000) percentageY = 0.27;
    else if (priceNum <= 70000) percentageY = 0.22;
    else if (priceNum <= 80000) percentageY = 0.23;
    else if (priceNum <= 100000) percentageY = 0.24;
    else if (priceNum <= 130000) percentageY = 0.20;
    else if (priceNum <= 160000) percentageY = 0.185;
    else if (priceNum <= 200000) percentageY = 0.22;
    else if (priceNum <= 250000) percentageY = 0.17;
    else if (priceNum <= 300000) percentageY = 0.18;
    else if (priceNum <= 400000) percentageY = 0.18;
    else if (priceNum <= 500000) percentageY = 0.16;
    else percentageY = 0.145;
    
    // Calculate reserve price
    const calculatedReservePrice = Math.round(priceNum - (priceNum * percentageY));
    setReservePrice(calculatedReservePrice);
    setValue('reserve_price', calculatedReservePrice);
    
  }, [price, setValue]);
  
  return (
    <div className="grid gap-6">
      <div className="space-y-2">
        <Label htmlFor="price">Asking Price (PLN)</Label>
        <Input
          id="price"
          {...register('price', { valueAsNumber: true })}
          type="number"
          placeholder="e.g. 50000"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="reserve_price">Reserve Price (PLN)</Label>
        <Input
          id="reserve_price"
          {...register('reserve_price', { valueAsNumber: true })}
          type="number"
          value={reservePrice || ''}
          onChange={(e) => {
            const value = e.target.value ? Number(e.target.value) : undefined;
            setReservePrice(value);
            setValue('reserve_price', value);
          }}
          placeholder="Minimum acceptable price"
        />
        <p className="text-xs text-gray-500 mt-1">
          Recommended reserve price based on our calculations
        </p>
      </div>
    </div>
  );
};
