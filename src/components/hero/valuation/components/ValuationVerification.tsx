
/**
 * ValuationVerification Component
 * Created: 2025-05-20 - Added to verify reserve price calculations in valuation dialog
 */

import React, { useEffect, useState } from 'react';
import { validateReservePrice } from '@/utils/valuation/reservePriceValidator';
import { formatPrice } from '@/utils/valuation/reservePriceCalculator';
import { AlertCircle } from 'lucide-react';

interface ValuationVerificationProps {
  valuationData: {
    make?: string;
    model?: string;
    year?: number;
    vin?: string;
    transmission?: 'manual' | 'automatic';
    mileage?: number;
    reservePrice?: number;
    averagePrice?: number;
    basePrice?: number;
  };
}

export const ValuationVerification = ({ valuationData }: ValuationVerificationProps) => {
  const [showDetails, setShowDetails] = useState(false);
  const [verification, setVerification] = useState<any>(null);
  
  useEffect(() => {
    if (valuationData?.basePrice && valuationData?.reservePrice) {
      // Validate the reserve price against our pricing rules
      const validation = validateReservePrice(
        valuationData.basePrice, 
        valuationData.reservePrice
      );
      
      setVerification(validation);
      
      // Log validation for debugging
      console.log('Reserve price validation:', validation);
    }
  }, [valuationData]);
  
  // Only render if we have verification data
  if (!verification || !valuationData.basePrice || !valuationData.reservePrice) {
    return null;
  }
  
  // If the price is correct within tolerance, don't show anything
  if (verification.isValid) {
    return null;
  }
  
  // Calculate absolute discrepancy for display
  const discrepancy = Math.abs(verification.discrepancy);
  const isHigher = valuationData.reservePrice > verification.expectedReservePrice;
  
  return (
    <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start gap-2">
        <AlertCircle className="h-5 w-5 text-amber-700 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-amber-900">Price Discrepancy Detected</h4>
          <p className="text-sm text-amber-900 mt-1">
            Base Price: {formatPrice(valuationData.basePrice)}
          </p>
          
          <div className="mt-2 space-y-1">
            <p className="text-sm text-amber-900">
              Price Tier: {verification.priceTier} ({verification.appliedPercentage}% discount)
            </p>
            <p className="text-sm text-amber-900">
              Displayed Price: {formatPrice(valuationData.reservePrice)}
            </p>
            <p className="text-sm text-amber-900">
              Expected Price: {formatPrice(verification.expectedReservePrice)}
            </p>
            <p className="text-sm text-red-600 font-medium">
              Discrepancy: {formatPrice(discrepancy)} ({verification.discrepancyPercent.toFixed(2)}%)
            </p>
          </div>
          
          <button 
            className="mt-3 text-sm font-medium text-amber-700 hover:text-amber-900"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
          
          {showDetails && (
            <div className="mt-3 text-xs border-t border-amber-200 pt-2">
              <p className="text-amber-900">
                Our reserve price calculation follows this formula:
              </p>
              <p className="text-amber-900 mt-1">
                1. Base price = (price_min + price_med) / 2
              </p>
              <p className="text-amber-900 mt-1">
                2. Reserve price = Base price - (Base price × Percentage discount)
              </p>
              <p className="text-amber-900 mt-1">
                3. For a base price of {formatPrice(valuationData.basePrice)}, the discount should be {verification.appliedPercentage}%
              </p>
              <p className="text-amber-900 mt-1">
                4. Expected result: {formatPrice(valuationData.basePrice)} - ({formatPrice(valuationData.basePrice)} × {verification.appliedPercentage / 100}) = {formatPrice(verification.expectedReservePrice)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
