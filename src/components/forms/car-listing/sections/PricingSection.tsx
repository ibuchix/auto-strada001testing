
/**
 * PricingSection component
 * Created: 2025-07-18
 * Updated: 2025-07-26 - Added readonly mode for valuation-based prices
 * Updated: 2025-08-01 - Enhanced read-only state for valuation prices and improved UI feedback
 * Updated: 2025-05-26 - Fixed field names to use camelCase for frontend consistency
 * Updated: 2025-06-01 - Fixed valuation data handling and ensure prices are properly formatted in PLN
 * Updated: 2025-06-02 - Fixed useEffect import and improved price display
 * Updated: 2025-05-29 - SIMPLIFIED to single reserve price field - removed price/reserve_price confusion
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
  
  // Check if this form is coming from valuation
  const fromValuation = watch('fromValuation') || Boolean(watch('valuationData'));
  
  // Load valuation data if available
  useEffect(() => {
    const valuationData = watch('valuationData');
    
    if (fromValuation && valuationData) {
      console.log('PricingSection - Loading valuation data:', valuationData);
      
      // Set reserve price from valuation data (single price source)
      if (valuationData.reservePrice) {
        setValue('reservePrice', valuationData.reservePrice, { shouldDirty: true });
      } else if (valuationData.basePrice || valuationData.averagePrice) {
        const valuationPrice = valuationData.basePrice || valuationData.averagePrice;
        setValue('reservePrice', valuationPrice, { shouldDirty: true });
      }
    }
  }, [fromValuation, setValue, watch]);
  
  // Calculate reserve price based on user input (if not from valuation)
  useEffect(() => {
    if (fromValuation || !reservePrice) return;
    
    // Convert to number for calculation
    const priceNum = Number(reservePrice);
    if (isNaN(priceNum) || priceNum <= 0) return;
    
    // If user manually entered a price, apply our reserve price calculation
    // to suggest the calculated reserve price
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
    
    // Calculate suggested reserve price
    const calculatedReservePrice = Math.round(priceNum - (priceNum * percentageY));
    
    console.log('PricingSection - Calculated reserve price suggestion:', {
      inputPrice: priceNum,
      calculatedReservePrice,
      percentage: percentageY
    });
    
  }, [reservePrice, fromValuation]);
  
  // Log valuation data for debugging
  useEffect(() => {
    if (fromValuation) {
      const valuationData = watch('valuationData');
      console.log('PricingSection - fromValuation is true with data:', { 
        reservePrice: watch('reservePrice'), 
        valuationData,
        formattedPrice: formatCurrency(watch('reservePrice'))
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
      </div>
    </div>
  );
};
