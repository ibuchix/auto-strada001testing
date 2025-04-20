
/**
 * ValuationPriceDisplay Component
 * - Updated 2025-04-20: Enhanced price validation and display
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
  const hasValidReservePrice = reservePrice > 0;
  const hasValidAveragePrice = averagePrice && averagePrice > 0;

  // Log price display for debugging
  console.log('ValuationPriceDisplay values:', {
    reservePrice,
    averagePrice,
    hasValidReservePrice,
    hasValidAveragePrice,
    timestamp: new Date().toISOString()
  });

  return (
    <div className="mt-4 p-5 bg-gray-50 rounded-lg border border-gray-100">
      <div className="flex flex-col gap-3">
        {hasValidReservePrice && (
          <div>
            <h3 className="text-sm font-medium text-gray-500">Reserve Price</h3>
            <p className="text-2xl font-bold text-DC143C">{formatCurrency(reservePrice)}</p>
          </div>
        )}
        
        {showAveragePrice && hasValidAveragePrice && (
          <div>
            <h3 className="text-sm font-medium text-gray-500">Market Value</h3>
            <p className="text-xl font-semibold text-gray-700">{formatCurrency(averagePrice)}</p>
          </div>
        )}
      </div>
    </div>
  );
};
