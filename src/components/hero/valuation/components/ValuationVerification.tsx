
/**
 * ValuationVerification Component
 * Created: 2025-05-20 - Added to verify reserve price calculations in valuation dialog
 * Updated: 2025-05-21 - Modified to acknowledge that displayed price is our calculated price
 * Updated: 2025-05-22 - Fixed TypeScript error with ourCalculatedPrice property
 */

import React, { useEffect, useState } from 'react';
import { validateReservePrice } from '@/utils/valuation/reservePriceValidator';
import { formatPrice, calculateReservePrice } from '@/utils/valuation/reservePriceCalculator';
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
    if (valuationData?.basePrice) {
      // Calculate our expected reserve price based on the base price
      const ourCalculatedPrice = calculateReservePrice(valuationData.basePrice);
      
      // Compare with the API-provided reserve price for information only
      const apiProvidedPrice = valuationData.reservePrice || 0;
      
      // Create verification object
      const validation = validateReservePrice(
        valuationData.basePrice, 
        apiProvidedPrice
      );
      
      // Add our calculated price to the validation result
      const enhancedValidation = {
        ...validation,
        ourCalculatedPrice
      };
      
      setVerification(enhancedValidation);
      
      // Log validation for debugging
      console.log('Reserve price validation:', enhancedValidation, 'Our calculated price:', ourCalculatedPrice);
    }
  }, [valuationData]);
  
  // Only render if we have verification data
  if (!verification || !valuationData.basePrice || !valuationData.reservePrice) {
    return null;
  }
  
  // Add an info message about which price is displayed
  return (
    <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
      <div className="flex items-start gap-2">
        <AlertCircle className="h-5 w-5 text-blue-700 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-blue-900">Price Information</h4>
          <p className="text-sm text-blue-700 mt-1">
            The reserve price shown above is calculated based on our pricing model.
          </p>
          
          <div className="mt-2 space-y-1">
            <p className="text-sm text-blue-900">
              Base Price: {formatPrice(valuationData.basePrice)}
            </p>
            <p className="text-sm text-blue-900">
              Price Tier: {verification.priceTier} ({verification.appliedPercentage}% discount)
            </p>
          </div>
          
          <button 
            className="mt-3 text-sm font-medium text-blue-700 hover:text-blue-900"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
          
          {showDetails && (
            <div className="mt-3 text-xs border-t border-blue-200 pt-2">
              <p className="text-blue-900">
                Our reserve price calculation follows this formula:
              </p>
              <p className="text-blue-900 mt-1">
                1. Base price = (price_min + price_med) / 2
              </p>
              <p className="text-blue-900 mt-1">
                2. Reserve price = Base price - (Base price × Percentage discount)
              </p>
              <p className="text-blue-900 mt-1">
                3. For a base price of {formatPrice(valuationData.basePrice)}, the discount is {verification.appliedPercentage}%
              </p>
              <p className="text-blue-900 mt-1">
                4. Your Reserve Price: {formatPrice(verification.expectedReservePrice)}
              </p>
              <p className="text-blue-900 mt-1">
                5. Calculated using mileage: {valuationData.mileage?.toLocaleString() || 0} km
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
