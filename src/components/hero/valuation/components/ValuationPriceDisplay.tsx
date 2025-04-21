
/**
 * ValuationPriceDisplay Component
 * - Updated 2025-04-20: Enhanced price validation and display
 * - Updated 2025-04-20: Added fallback for missing price data
 * - Updated 2025-04-20: Fixed handling of edge cases for better reliability
 * - Updated 2025-04-21: Improved price display with better data debugging
 * - Updated 2025-04-21: Added better validation for price extraction
 */

import { formatCurrency } from "@/utils/formatters";

interface ValuationPriceDisplayProps {
  reservePrice: number;
  showAveragePrice?: boolean;
  averagePrice?: number | null;
}

export const ValuationPriceDisplay = ({ 
  reservePrice, 
  showAveragePrice = false,
  averagePrice
}: ValuationPriceDisplayProps) => {
  // Ensure we have valid numbers
  const validReservePrice = typeof reservePrice === 'number' && !isNaN(reservePrice) ? reservePrice : 0;
  const validAveragePrice = typeof averagePrice === 'number' && !isNaN(averagePrice) ? averagePrice : 0;
  
  // Determine if we have valid prices to display
  const hasValidReservePrice = validReservePrice > 0;
  const hasValidAveragePrice = validAveragePrice > 0;
  const hasNoValidPrices = !hasValidReservePrice && !hasValidAveragePrice;

  // Log price display for debugging with more detailed information
  console.log('ValuationPriceDisplay values:', {
    inputReservePrice: reservePrice,
    inputAveragePrice: averagePrice,
    validReservePrice,
    validAveragePrice,
    hasValidReservePrice,
    hasValidAveragePrice,
    hasNoValidPrices,
    timestamp: new Date().toISOString()
  });

  return (
    <div className="mt-4 p-5 bg-gray-50 rounded-lg border border-gray-100">
      <div className="flex flex-col gap-3">
        {hasValidReservePrice ? (
          <div>
            <h3 className="text-sm font-medium text-gray-500">Reserve Price</h3>
            <p className="text-2xl font-bold text-DC143C">{formatCurrency(validReservePrice)}</p>
          </div>
        ) : null}
        
        {showAveragePrice && hasValidAveragePrice ? (
          <div>
            <h3 className="text-sm font-medium text-gray-500">Market Value</h3>
            <p className="text-xl font-semibold text-gray-700">{formatCurrency(validAveragePrice)}</p>
          </div>
        ) : null}
        
        {hasNoValidPrices && (
          <div>
            <h3 className="text-sm font-medium text-gray-500">Price Information</h3>
            <p className="text-base text-gray-700">Contact support for pricing information</p>
            <p className="text-xs text-gray-500 mt-1">You can still list your car with us.</p>
          </div>
        )}
      </div>
    </div>
  );
};
