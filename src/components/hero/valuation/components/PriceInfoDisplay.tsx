
/**
 * Component for displaying price information in valuation results
 * Created: 2025-04-17
 * Modified: 2025-04-23 - Updated to use consolidated price utilities
 * Modified: 2025-04-30 - Component simplified to only show reserve price
 */

import { formatPrice } from '@/utils/priceUtils';

interface PriceInfoDisplayProps {
  reservePrice: number;
}

export const PriceInfoDisplay = ({ reservePrice }: PriceInfoDisplayProps) => {
  return (
    <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <h3 className="text-lg font-medium mb-2">Your Vehicle Valuation</h3>
      
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
