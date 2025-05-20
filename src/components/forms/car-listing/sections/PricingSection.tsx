
/**
 * PricingSection component
 * Created: 2025-07-18
 * Updated: 2025-07-26 - Added readonly mode for valuation-based prices
 * Updated: 2025-08-01 - Enhanced read-only state for valuation prices and improved UI feedback
 * Updated: 2025-05-26 - Fixed field names to use camelCase for frontend consistency
 */

import { useFormContext, useWatch } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon, LockIcon } from 'lucide-react';
import { CarListingFormData } from '@/types/forms';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';

export const PricingSection = () => {
  const { register, setValue, watch, getValues } = useFormContext<CarListingFormData>();
  const price = watch('price');
  const [reservePrice, setReservePrice] = useState<number | undefined>(undefined);
  
  // Check if this form is coming from valuation
  const fromValuation = watch('fromValuation') || Boolean(watch('valuationData'));
  
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
    setValue('reservePrice', calculatedReservePrice);
    
  }, [price, setValue]);
  
  // Log valuation data for debugging
  useEffect(() => {
    if (fromValuation) {
      const valuationData = watch('valuationData');
      console.log('PricingSection - fromValuation is true with data:', { 
        price: watch('price'), 
        reservePrice: watch('reservePrice'),
        valuationData
      });
    }
  }, [fromValuation, watch]);
  
  return (
    <div className="grid gap-6">
      {fromValuation && (
        <Alert className="bg-blue-50 border-blue-200">
          <div className="flex items-start gap-2">
            <InfoIcon className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="space-y-1">
              <AlertDescription className="font-medium text-blue-800">
                These prices are set based on your vehicle valuation and cannot be modified
              </AlertDescription>
              <p className="text-sm text-blue-700">
                The starting price and reserve price have been calculated from your vehicle's valuation data.
              </p>
            </div>
          </div>
        </Alert>
      )}
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="price" className="flex items-center gap-2">
            Starting Price (PLN)
            {fromValuation && <LockIcon className="h-4 w-4 text-gray-500" />}
          </Label>
          {fromValuation && (
            <Badge variant="outline" className="bg-gray-100 text-gray-600">
              Valuation-based
            </Badge>
          )}
        </div>
        <Input
          id="price"
          {...register('price', { valueAsNumber: true })}
          type="number"
          placeholder="e.g. 50000"
          required
          readOnly={fromValuation}
          disabled={fromValuation}
          className={fromValuation ? "bg-gray-50 border-gray-300 cursor-not-allowed text-gray-700 font-medium" : ""}
        />
        {fromValuation && (
          <p className="text-xs text-gray-500 mt-1">
            This starting price has been set based on your vehicle's valuation and cannot be changed.
          </p>
        )}
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="reservePrice" className="flex items-center gap-2">
            Reserve Price (PLN)
            {fromValuation && <LockIcon className="h-4 w-4 text-gray-500" />}
          </Label>
          {fromValuation && (
            <Badge variant="outline" className="bg-gray-100 text-gray-600">
              Auto-calculated
            </Badge>
          )}
        </div>
        <Input
          id="reservePrice"
          {...register('reservePrice', { valueAsNumber: true })}
          type="number"
          value={reservePrice || ''}
          onChange={(e) => {
            if (fromValuation) return; // Don't allow changes when from valuation
            const value = e.target.value ? Number(e.target.value) : undefined;
            setReservePrice(value);
            setValue('reservePrice', value);
          }}
          placeholder="Minimum acceptable price"
          readOnly={fromValuation}
          disabled={fromValuation}
          className={fromValuation ? "bg-gray-50 border-gray-300 cursor-not-allowed text-gray-700 font-medium" : ""}
        />
        <p className="text-xs text-gray-500 mt-1">
          {fromValuation 
            ? "This reserve price is calculated from your valuation and cannot be changed. It represents the minimum price your vehicle will sell for."
            : "Recommended reserve price based on our calculations"
          }
        </p>
      </div>
    </div>
  );
};
