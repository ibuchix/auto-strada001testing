
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
 * - 2026-04-15: Enhanced error resilience and improved visual feedback
 * - 2028-05-18: Fixed GeneralErrorHandler props
 * - 2028-06-02: Fixed zero price display issue and improved debugging
 */

import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle, Info } from "lucide-react";
import { useEffect } from "react";
import { GeneralErrorHandler } from "@/components/error-handling/GeneralErrorHandler";
import { ErrorCategory } from "@/errors/types";
import { LoadingIndicator } from "@/components/common/LoadingIndicator";

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
  // Debug log props on mount and when they change
  useEffect(() => {
    console.log('ValuationDisplay mounted/updated with props:', {
      reservePrice: reservePrice !== undefined ? reservePrice : 'undefined',
      reservePriceType: reservePrice !== undefined ? typeof reservePrice : 'undefined',
      reservePriceValue: reservePrice,
      averagePrice: averagePrice !== undefined ? averagePrice : 'undefined',
      isLoading,
      hasError: !!error
    });
  }, [reservePrice, averagePrice, isLoading, error]);

  if (isLoading) {
    return (
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 text-center">
        <p className="text-sm text-subtitle mb-2">Calculating...</p>
        <div className="flex items-center justify-center">
          <LoadingIndicator message="" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
        <GeneralErrorHandler 
          error={error} 
          category={ErrorCategory.GENERAL}
          title="Valuation Error" 
          description="We encountered an issue while calculating the valuation."
          onRetry={onRetry}
          primaryAction={onRetry ? {
            label: "Try Again",
            onClick: onRetry
          } : undefined}
        />
      </div>
    );
  }

  // Log value for debugging
  console.log('ValuationDisplay rendering with price:', 
    reservePrice !== undefined && reservePrice !== null ? reservePrice : 'undefined/null');

  // Show "No valuation available" if reserve price is undefined, null, NaN, 0, or negative
  const hasValidPrice = reservePrice !== undefined && 
                       reservePrice !== null && 
                       !isNaN(Number(reservePrice)) && 
                       Number(reservePrice) > 0;
                       
  if (!hasValidPrice) {
    console.warn('ValuationDisplay received invalid reserve price:', reservePrice);
    return (
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 text-center">
        <p className="text-sm text-subtitle mb-2">Valuation</p>
        <div className="flex items-center justify-center gap-2 mb-2">
          <Info size={16} className="text-primary" />
          <p className="text-lg font-medium">
            No valuation available
          </p>
        </div>
        {onRetry && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry}
            className="flex items-center gap-1 mt-2"
          >
            <RefreshCw className="h-3 w-3" />
            Try Again
          </Button>
        )}
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
    </div>
  );
};
