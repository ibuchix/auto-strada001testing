
/**
 * ValuationPriceDisplay Component
 * - Updated 2025-05-01: Now uses centralized price formatting utilities
 * - Updated 2025-05-03: Removed all fallback price estimation mechanisms
 * - Updated 2025-05-03: Simplified price display with strict validation
 * - Updated 2025-05-03: Enhanced debugging for price data availability
 * - Updated 2025-04-23: Updated to use consolidated price utilities
 * - Updated 2025-04-29: Removed market price display as per business requirements
 * - Updated 2025-05-21: Changed to display our calculated reserve price as "Your Reserve Price"
 * - Updated 2025-05-22: Enhanced to better display reserve price with mileage consideration
 */

import { formatPrice, calculateReservePrice } from "@/utils/valuation/reservePriceCalculator";
import { useEffect, useMemo } from "react";

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
            <h3 className="text-sm font-medium text-gray-500">Your Reserve Price</h3>
            <p className="text-2xl font-bold text-DC143C">{formatPrice(ourReservePrice)}</p>
            <p className="text-xs text-gray-500 mt-1">
              Calculated based on mileage: {mileage?.toLocaleString() || 0} km
            </p>
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
