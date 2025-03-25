
/**
 * Changes made:
 * - 2024-03-19: Added support for server-calculated reserve price with client fallback
 * - 2024-03-19: Improved loading and error states
 * - 2024-03-19: Added proper type checking for price values
 * - 2024-07-20: Enhanced error display with clearer messages and retry option
 * - 2024-08-02: Removed average price display to prevent sellers from seeing it
 * - 2025-10-20: Fixed reserve price display and improved property handling
 * - 2024-12-14: Fixed price rendering and added better debugging for valuation issues
 * - 2026-04-10: Added strict type checking and proper null/undefined handling
 */

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useEffect } from "react";

interface ValuationDisplayProps {
  reservePrice: number | undefined | null;
  averagePrice?: number; // Still accept this prop but don't display it
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
}

export const ValuationDisplay = ({ 
  reservePrice,
  averagePrice, // Keep this in props but don't display it
  isLoading,
  error,
  onRetry
}: ValuationDisplayProps) => {
  // Debug log props on mount
  useEffect(() => {
    console.log('ValuationDisplay mounted with props:', {
      reservePrice: reservePrice !== undefined ? reservePrice : 'undefined',
      reservePriceType: reservePrice !== undefined ? typeof reservePrice : 'undefined',
      averagePrice: averagePrice !== undefined ? averagePrice : 'undefined',
      isLoading,
      hasError: !!error
    });
  }, [reservePrice, averagePrice, isLoading, error]);

  if (isLoading) {
    return (
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 text-center">
        <p className="text-sm text-subtitle mb-2">Calculating...</p>
        <div className="animate-pulse h-10 bg-primary/10 rounded" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 text-center">
        <p className="text-sm text-subtitle mb-2">Valuation</p>
        <p className="text-sm text-red-600 mb-3">{error}</p>
        {onRetry && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry}
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-3 w-3" />
            Try Again
          </Button>
        )}
      </div>
    );
  }

  // Log value for debugging
  console.log('ValuationDisplay rendering with price:', 
    reservePrice !== undefined && reservePrice !== null ? reservePrice : 'undefined/null');

  // Show "No valuation available" if reserve price is undefined, null, NaN, or negative
  const hasValidPrice = reservePrice !== undefined && 
                       reservePrice !== null && 
                       !isNaN(Number(reservePrice)) && 
                       Number(reservePrice) >= 0;
                       
  if (!hasValidPrice) {
    console.warn('ValuationDisplay received invalid reserve price:', reservePrice);
    return (
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 text-center">
        <p className="text-sm text-subtitle mb-2">Valuation</p>
        <p className="text-4xl font-bold text-primary">
          No valuation available
        </p>
      </div>
    );
  }

  // Convert to number and format
  const formattedPrice = Math.max(0, Number(reservePrice)).toLocaleString();
  
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 text-center">
      <p className="text-sm text-subtitle mb-2">Reserve Price</p>
      <p className="text-4xl font-bold text-primary">
        PLN {formattedPrice}
      </p>
      {/* Removed the averagePrice display */}
    </div>
  );
};
