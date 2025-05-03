
/**
 * ValuationPriceDisplay Component
 * - Updated 2025-05-01: Now uses centralized price formatting utilities
 * - Updated 2025-05-03: Removed all fallback price estimation mechanisms
 * - Updated 2025-05-03: Simplified price display with strict validation
 * - Updated 2025-05-03: Enhanced debugging for price data availability
 * - Updated 2025-05-23: Simplified UI by removing detailed calculation information
 * - Updated 2025-05-24: Fixed mileage display and formatting in price calculation text
 * - Updated 2025-05-25: Enhanced mileage display to always show actual entered value
 * - Updated 2025-08-01: Added clarification about fixed price for sellers
 * - Updated 2025-08-23: Added stronger visual indicators that prices are fixed
 */

import { formatPrice, calculateReservePrice } from "@/utils/valuation/reservePriceCalculator";
import { useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { LockIcon } from "lucide-react";

interface ValuationPriceDisplayProps {
  reservePrice: number;
  showAveragePrice?: boolean;
  averagePrice?: number | null;
  errorDetails?: string;
  apiSource?: string;
  mileage?: number;
}

export const ValuationPriceDisplay = ({ 
  reservePrice, 
  showAveragePrice = false, // We'll ignore this prop now
  averagePrice,
  mileage = 0,
  errorDetails,
  apiSource = 'auto_iso'
}: ValuationPriceDisplayProps) => {
  // Log received values for debugging
  useEffect(() => {
    console.log('ValuationPriceDisplay received values:', {
      reservePrice,
      averagePrice,
      mileage,
      showAveragePrice,
      apiSource,
      errorDetails,
      isReservePriceValid: typeof reservePrice === 'number' && reservePrice > 0,
      isAveragePriceValid: typeof averagePrice === 'number' && averagePrice > 0,
      timestamp: new Date().toISOString()
    });
  }, [reservePrice, averagePrice, showAveragePrice, errorDetails, apiSource, mileage]);

  // Calculate our own reserve price based on our formula
  // Use averagePrice (which is our basePrice) to calculate our reserve price
  const ourReservePrice = useMemo(() => {
    if (typeof averagePrice === 'number' && averagePrice > 0) {
      // Use our calculation formula to determine reserve price
      return calculateReservePrice(averagePrice);
    }
    // If no valid base price, fallback to the provided reserve price (should not happen)
    return typeof reservePrice === 'number' && !isNaN(reservePrice) && reservePrice > 0 
      ? reservePrice 
      : 0;
  }, [averagePrice, reservePrice]);
  
  // Determine if we have valid prices to display
  const hasValidReservePrice = ourReservePrice > 0;
  
  return (
    <div className="mt-4 p-5 bg-gray-50 rounded-lg border border-gray-100">
      <div className="flex flex-col gap-3">
        {hasValidReservePrice ? (
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-medium text-gray-500 flex items-center gap-2">
                Your Reserve Price
                <LockIcon size={14} className="text-gray-500" />
              </h3>
              <Badge variant="outline" className="bg-gray-100 text-gray-700">Fixed</Badge>
            </div>
            <p className="text-2xl font-bold text-DC143C">{formatPrice(ourReservePrice)}</p>
            <div className="space-y-2 mt-2">
              <p className="text-xs text-gray-500">
                Calculated based on mileage: {mileage ? mileage.toLocaleString() : '0'} km
              </p>
              <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-md">
                <p className="text-sm text-blue-800 font-medium">
                  This price is fixed and cannot be changed
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  The reserve price is the minimum amount your car will sell for in the auction.
                  When you proceed to list your car, this price will be automatically used.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="text-sm font-medium text-gray-500">Price Information</h3>
            <p className="text-base text-gray-700">Price data not available</p>
          </div>
        )}
      </div>
    </div>
  );
};
