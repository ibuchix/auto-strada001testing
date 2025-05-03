
/**
 * PricingSection component
 * Created: 2025-07-18
 * Updated: 2025-07-26 - Added readonly mode for valuation-based prices
 */

import { useFormContext, useWatch } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon, LockIcon } from 'lucide-react';
import { CarListingFormData } from '@/types/forms';
import { useState, useEffect } from 'react';

export const PricingSection = () => {
  const { register, setValue, watch, getValues } = useFormContext<CarListingFormData>();
  const price = watch('price');
  const [reservePrice, setReservePrice] = useState<number | undefined>(undefined);
  
  // Check if this form is coming from valuation
  const fromValuation = watch('fromValuation') || Boolean(watch('valuation_data'));
  
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
      {fromValuation && (
        <Alert className="bg-blue-50 text-blue-800 border-blue-200">
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            The price has been set based on the valuation of your vehicle and cannot be changed.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="price" className="flex items-center">
          Asking Price (PLN)
          {fromValuation && <LockIcon className="h-4 w-4 ml-2 text-gray-500" />}
        </Label>
        <Input
          id="price"
          {...register('price', { valueAsNumber: true })}
          type="number"
          placeholder="e.g. 50000"
          required
          readOnly={fromValuation}
          disabled={fromValuation}
          className={fromValuation ? "bg-gray-100 cursor-not-allowed" : ""}
        />
        {fromValuation && (
          <p className="text-xs text-gray-500 mt-1">
            This price is based on the valuation of your vehicle and cannot be changed.
          </p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="reserve_price" className="flex items-center">
          Reserve Price (PLN)
          {fromValuation && <LockIcon className="h-4 w-4 ml-2 text-gray-500" />}
        </Label>
        <Input
          id="reserve_price"
          {...register('reserve_price', { valueAsNumber: true })}
          type="number"
          value={reservePrice || ''}
          onChange={(e) => {
            if (fromValuation) return; // Don't allow changes when from valuation
            const value = e.target.value ? Number(e.target.value) : undefined;
            setReservePrice(value);
            setValue('reserve_price', value);
          }}
          placeholder="Minimum acceptable price"
          readOnly={fromValuation}
          disabled={fromValuation}
          className={fromValuation ? "bg-gray-100 cursor-not-allowed" : ""}
        />
        <p className="text-xs text-gray-500 mt-1">
          {fromValuation 
            ? "This reserve price is calculated based on the valuation and cannot be changed."
            : "Recommended reserve price based on our calculations"
          }
        </p>
      </div>
    </div>
  );
};
