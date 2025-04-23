
/**
 * Component for displaying price information in valuation results
 * Created: 2025-04-17
 * Modified: 2025-04-23 - Updated to use consolidated price utilities
 */

import { formatPrice } from '@/utils/priceUtils';

interface PriceInfoDisplayProps {
  reservePrice: number;
  averagePrice?: number;
}

export const PriceInfoDisplay = ({ reservePrice, averagePrice }: PriceInfoDisplayProps) => {
  return (
    <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <h3 className="text-lg font-medium mb-2">Your Vehicle Valuation</h3>
      
      {averagePrice && (
        <div className="mb-3">
          <span className="text-gray-700">Market Average: </span>
          <span className="font-semibold">{formatPrice(averagePrice)}</span>
        </div>
      )}
      
      <div className="mb-2">
        <span className="text-gray-700">Reserve Price: </span>
        <span className="text-lg font-bold text-secondary">{formatPrice(reservePrice)}</span>
      </div>
      
      <p className="text-sm text-gray-600 mt-2">
        This is the minimum price your vehicle will be listed for in our auction.
      </p>
    </div>
  );
};
