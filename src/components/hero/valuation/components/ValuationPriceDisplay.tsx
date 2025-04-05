
/**
 * ValuationPriceDisplay Component
 * - Added 2025-04-05: Created component to display valuation price information
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
  return (
    <div className="mt-4 p-5 bg-gray-50 rounded-lg border border-gray-100">
      <div className="flex flex-col gap-3">
        <div>
          <h3 className="text-sm font-medium text-gray-500">Estimated Value</h3>
          <p className="text-2xl font-bold text-secondary">{formatCurrency(reservePrice, 'PLN')}</p>
        </div>
        
        {showAveragePrice && averagePrice && (
          <div>
            <h3 className="text-sm font-medium text-gray-500">Market Average</h3>
            <p className="text-xl font-semibold text-gray-700">{formatCurrency(averagePrice, 'PLN')}</p>
          </div>
        )}
      </div>
    </div>
  );
};
