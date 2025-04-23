
/**
 * ValuationPriceDisplay Component
 * - Updated 2025-05-03: Removed all fallback price estimation mechanisms
 * - Updated 2025-05-03: Simplified price display with strict validation
 * - Updated 2025-05-03: Enhanced debugging for price data availability
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
  apiSource = 'auto_iso'
}: ValuationPriceDisplayProps) => {
  // Log received values for debugging
  useEffect(() => {
    console.log('ValuationPriceDisplay received values:', {
      reservePrice,
      averagePrice,
      showAveragePrice,
      apiSource,
      errorDetails,
      isReservePriceValid: typeof reservePrice === 'number' && reservePrice > 0,
      isAveragePriceValid: typeof averagePrice === 'number' && averagePrice > 0,
      timestamp: new Date().toISOString()
    });
  }, [reservePrice, averagePrice, showAveragePrice, errorDetails, apiSource]);

  // Ensure we have valid numbers
  const validReservePrice = typeof reservePrice === 'number' && !isNaN(reservePrice) && reservePrice > 0 
    ? reservePrice 
    : 0;
    
  const validAveragePrice = typeof averagePrice === 'number' && !isNaN(averagePrice) && averagePrice > 0
    ? averagePrice 
    : 0;
  
  // Determine if we have valid prices to display
  const hasValidReservePrice = validReservePrice > 0;
  const hasValidAveragePrice = validAveragePrice > 0 && showAveragePrice;
  
  return (
    <div className="mt-4 p-5 bg-gray-50 rounded-lg border border-gray-100">
      <div className="flex flex-col gap-3">
        {hasValidReservePrice ? (
          <div>
            <h3 className="text-sm font-medium text-gray-500">Reserve Price</h3>
            <p className="text-2xl font-bold text-DC143C">{formatCurrency(validReservePrice)}</p>
          </div>
        ) : null}
        
        {hasValidAveragePrice ? (
          <div>
            <h3 className="text-sm font-medium text-gray-500">Market Value</h3>
            <p className="text-xl font-semibold text-gray-700">{formatCurrency(validAveragePrice)}</p>
          </div>
        ) : null}
        
        {!hasValidReservePrice && !hasValidAveragePrice && (
          <div>
            <h3 className="text-sm font-medium text-gray-500">Price Information</h3>
            <p className="text-base text-gray-700">Price data not available</p>
          </div>
        )}
      </div>
    </div>
  );
};
