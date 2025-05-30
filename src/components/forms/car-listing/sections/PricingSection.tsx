
/**
 * PricingSection component
 * Updated: 2025-05-30 - Fixed valuation data loading and reserve price display
 */

import { useFormContext, useWatch } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon, LockIcon } from 'lucide-react';
import { CarListingFormData } from '@/types/forms';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/formatters';

export const PricingSection = () => {
  const { register, setValue, watch, getValues } = useFormContext<CarListingFormData>();
  const reservePrice = watch('reservePrice');
  const valuationData = watch('valuationData');
  const fromValuation = watch('fromValuation') || Boolean(valuationData);
  
  // Debug current form values
  useEffect(() => {
    const currentReservePrice = watch('reservePrice');
    const currentValuationData = watch('valuationData');
    const currentFromValuation = watch('fromValuation');
    
    console.log('PricingSection: Current form state:', {
      reservePrice: currentReservePrice,
      hasValuationData: !!currentValuationData,
      fromValuation: currentFromValuation,
      valuationReservePrice: currentValuationData?.reservePrice,
      valuationPrice: currentValuationData?.valuation
    });
  }, [watch]);
  
  // Load reserve price from valuation data if available
  useEffect(() => {
    if (fromValuation && valuationData && (!reservePrice || reservePrice === 0)) {
      const valuationReservePrice = valuationData.reservePrice || valuationData.valuation || 0;
      
      if (valuationReservePrice > 0) {
        console.log('PricingSection: Setting reserve price from valuation data:', valuationReservePrice);
        setValue('reservePrice', valuationReservePrice, { shouldDirty: true, shouldTouch: true });
      }
    }
  }, [fromValuation, valuationData, reservePrice, setValue]);
  
  // Also try to load from localStorage as fallback
  useEffect(() => {
    if (!fromValuation && (!reservePrice || reservePrice === 0)) {
      try {
        const storedValuationData = localStorage.getItem('valuationData');
        if (storedValuationData) {
          const parsedData = JSON.parse(storedValuationData);
          const storedReservePrice = parsedData.reservePrice || parsedData.valuation || 0;
          
          if (storedReservePrice > 0) {
            console.log('PricingSection: Loading reserve price from localStorage:', storedReservePrice);
            setValue('reservePrice', storedReservePrice, { shouldDirty: true });
            setValue('fromValuation', true);
            setValue('valuationData', parsedData);
          }
        }
      } catch (error) {
        console.error('PricingSection: Error loading from localStorage:', error);
      }
    }
  }, [reservePrice, fromValuation, setValue]);
  
  return (
    <div className="grid gap-6">
      {fromValuation && (
        <Alert className="bg-blue-50 border-blue-200">
          <div className="flex items-start gap-2">
            <InfoIcon className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="space-y-1">
              <AlertDescription className="font-medium text-blue-800">
                This price is set based on your vehicle valuation and cannot be modified
              </AlertDescription>
              <p className="text-sm text-blue-700">
                The reserve price has been calculated from your vehicle's valuation data.
              </p>
            </div>
          </div>
        </Alert>
      )}
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="reservePrice" className="flex items-center gap-2">
            Reserve Price (PLN)
            {fromValuation && <LockIcon className="h-4 w-4 text-gray-500" />}
          </Label>
          {fromValuation && (
            <Badge variant="outline" className="bg-gray-100 text-gray-600">
              Valuation-based
            </Badge>
          )}
        </div>
        <Input
          id="reservePrice"
          {...register('reservePrice', { valueAsNumber: true })}
          type="number"
          placeholder="e.g. 45000"
          required
          readOnly={fromValuation}
          disabled={fromValuation}
          className={fromValuation ? "bg-gray-50 border-gray-300 cursor-not-allowed text-gray-700 font-medium" : ""}
        />
        <p className="text-xs text-gray-500 mt-1">
          {fromValuation 
            ? "This reserve price is calculated from your valuation and represents the minimum price your vehicle will sell for."
            : "This is the minimum price you're willing to accept. Enter your desired reserve price."
          }
        </p>
        {reservePrice > 0 && (
          <p className="text-sm font-medium text-green-600">
            Current reserve price: {formatCurrency(reservePrice)}
          </p>
        )}
      </div>
    </div>
  );
};
