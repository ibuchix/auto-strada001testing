
/**
 * ValuationPriceDisplay Component
 * - Updated 2025-04-20: Enhanced price validation and display
 * - Updated 2025-04-20: Added fallback for missing price data
 * - Updated 2025-04-20: Fixed handling of edge cases for better reliability
 * - Updated 2025-04-21: Improved price display with better data debugging
 * - Updated 2025-04-21: Added better validation for price extraction
 * - Updated 2025-04-22: Enhanced data transformation validation for more reliable display
 * - Updated 2025-04-22: Added improved error handling for edge function responses
 * - Updated 2025-04-22: Fixed DialogContent issue by adding proper description
 * - Updated 2025-04-23: Added improved debugging and fallback message for failed API price data
 */

import { formatCurrency } from "@/utils/formatters";
import { useEffect } from "react";

interface ValuationPriceDisplayProps {
  reservePrice: number;
  showAveragePrice?: boolean;
  averagePrice?: number | null;
  errorDetails?: string;
  apiSource?: string;
}

export const ValuationPriceDisplay = ({ 
  reservePrice, 
  showAveragePrice = false,
  averagePrice,
  errorDetails,
  apiSource = 'default'
}: ValuationPriceDisplayProps) => {
  // Enhanced validation with more detailed logging
  useEffect(() => {
    console.log('ValuationPriceDisplay received values:', {
      reservePrice,
      averagePrice,
      showAveragePrice,
      apiSource,
      errorDetails,
      isReservePriceNumber: typeof reservePrice === 'number',
      isAveragePriceNumber: typeof averagePrice === 'number',
      timestamp: new Date().toISOString()
    });
  }, [reservePrice, averagePrice, showAveragePrice, errorDetails, apiSource]);

  // Ensure we have valid numbers with more robust validation
  const validReservePrice = typeof reservePrice === 'number' && !isNaN(reservePrice) && reservePrice > 0 
    ? reservePrice 
    : 0;
    
  const validAveragePrice = typeof averagePrice === 'number' && !isNaN(averagePrice) && averagePrice > 0
    ? averagePrice 
    : 0;
  
  // Determine if we have valid prices to display
  const hasValidReservePrice = validReservePrice > 0;
  const hasValidAveragePrice = validAveragePrice > 0;
  const hasNoValidPrices = !hasValidReservePrice && !hasValidAveragePrice;
  
  // Check if we're using estimated values (API failure fallback)
  const isUsingEstimated = apiSource === 'estimation' || reservePrice === 36500;

  // Log the validated values
  useEffect(() => {
    console.log('ValuationPriceDisplay validated values:', {
      validReservePrice,
      validAveragePrice,
      hasValidReservePrice,
      hasValidAveragePrice,
      hasNoValidPrices,
      isUsingEstimated,
      timestamp: new Date().toISOString()
    });
  }, [validReservePrice, validAveragePrice, hasValidReservePrice, 
      hasValidAveragePrice, hasNoValidPrices, isUsingEstimated]);

  return (
    <div className="mt-4 p-5 bg-gray-50 rounded-lg border border-gray-100">
      <div className="flex flex-col gap-3">
        {hasValidReservePrice ? (
          <div>
            <h3 className="text-sm font-medium text-gray-500">Reserve Price</h3>
            <p className="text-2xl font-bold text-DC143C">{formatCurrency(validReservePrice)}</p>
            {isUsingEstimated && (
              <p className="text-xs text-amber-600 mt-1">
                Estimated price based on vehicle data
              </p>
            )}
          </div>
        ) : null}
        
        {showAveragePrice && hasValidAveragePrice ? (
          <div>
            <h3 className="text-sm font-medium text-gray-500">Market Value</h3>
            <p className="text-xl font-semibold text-gray-700">{formatCurrency(validAveragePrice)}</p>
            {isUsingEstimated && (
              <p className="text-xs text-amber-600 mt-1">
                Estimated value based on vehicle data
              </p>
            )}
          </div>
        ) : null}
        
        {hasNoValidPrices && (
          <div>
            <h3 className="text-sm font-medium text-gray-500">Price Information</h3>
            <p className="text-base text-gray-700">Contact support for pricing information</p>
            <p className="text-xs text-gray-500 mt-1">You can still list your car with us.</p>
            {errorDetails && (
              <p className="text-xs text-amber-600 mt-2">
                Debug info: {errorDetails}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
