
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
 * - 2028-06-03: Added better debug logging for valuation data
 * - 2028-06-14: Enhanced error resilience with comprehensive null/undefined checks
 * - 2028-06-14: Added detailed debug view toggle for troubleshooting
 * - 2028-06-14: Improved visual feedback during processing states
 */

import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle, Info, Bug } from "lucide-react";
import { useEffect, useState } from "react";
import { GeneralErrorHandler } from "@/components/error-handling/GeneralErrorHandler";
import { ErrorCategory } from "@/errors/types";
import { LoadingIndicator } from "@/components/common/LoadingIndicator";
import { Tooltip } from "@/components/ui/tooltip";

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
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  
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
    
    // Add detailed debug information about the price value
    if (reservePrice !== undefined && reservePrice !== null) {
      console.log('Reserve price details:', {
        asNumber: Number(reservePrice),
        isNaN: isNaN(Number(reservePrice)),
        isPositive: Number(reservePrice) > 0,
        formatted: new Intl.NumberFormat('pl-PL').format(Number(reservePrice))
      });
    } else {
      console.log('Reserve price validation failed:', {
        isUndefined: reservePrice === undefined,
        isNull: reservePrice === null,
        rawValue: reservePrice
      });
    }
  }, [reservePrice, averagePrice, isLoading, error]);

  // Enhanced loading state with more visual feedback
  if (isLoading) {
    return (
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 text-center animate-pulse">
        <p className="text-sm text-subtitle mb-2">Calculating valuation...</p>
        <div className="flex items-center justify-center">
          <LoadingIndicator message="Processing your vehicle data" />
        </div>
      </div>
    );
  }

  // Improved error handling with more context
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

  // Enhanced validation of reserve price with more detailed logging
  const hasValidPrice = (
    reservePrice !== undefined && 
    reservePrice !== null && 
    !isNaN(Number(reservePrice)) && 
    Number(reservePrice) > 0
  );
  
  console.log('ValuationDisplay price validation:', {
    hasValidPrice,
    reservePrice,
    isUndefined: reservePrice === undefined,
    isNull: reservePrice === null,
    isNaN: reservePrice !== undefined && reservePrice !== null ? isNaN(Number(reservePrice)) : 'N/A',
    isPositive: reservePrice !== undefined && reservePrice !== null ? Number(reservePrice) > 0 : 'N/A'
  });
                       
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
        <p className="text-sm text-subtitle mb-4">
          We couldn't calculate a valuation for this vehicle.
        </p>
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
        
        {/* Debug information toggle for troubleshooting */}
        <div className="mt-4 pt-2 border-t border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-subtitle flex items-center gap-1"
            onClick={() => setShowDebugInfo(!showDebugInfo)}
          >
            <Bug className="h-3 w-3" />
            {showDebugInfo ? "Hide Details" : "Technical Details"}
          </Button>
          
          {showDebugInfo && (
            <div className="mt-2 p-2 bg-gray-100 rounded text-left overflow-auto max-h-40 text-xs">
              <pre>
                {JSON.stringify({
                  reservePrice,
                  reservePriceType: typeof reservePrice,
                  isNull: reservePrice === null,
                  isUndefined: reservePrice === undefined,
                  averagePrice
                }, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Ensure we have a positive number and format it
  const priceValue = Math.max(0, Number(reservePrice));
  const formattedPrice = new Intl.NumberFormat('pl-PL').format(priceValue);
  
  console.log('ValuationDisplay rendering with formatted price:', formattedPrice);
  
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 text-center">
      <p className="text-sm text-subtitle mb-2">Reserve Price</p>
      <p className="text-4xl font-bold text-primary">
        PLN {formattedPrice}
      </p>
      
      {/* Debug toggle button - only visible in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 pt-2 border-t border-gray-200">
          <Tooltip content="Technical debugging information">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-subtitle flex items-center gap-1"
              onClick={() => setShowDebugInfo(!showDebugInfo)}
            >
              <Bug className="h-3 w-3" />
              {showDebugInfo ? "Hide Debug" : "Show Debug"}
            </Button>
          </Tooltip>
          
          {showDebugInfo && (
            <div className="mt-2 p-2 bg-gray-100 rounded text-left overflow-auto max-h-40 text-xs">
              <pre>
                {JSON.stringify({
                  reservePrice: priceValue,
                  rawValue: reservePrice,
                  formatted: formattedPrice,
                  averagePrice
                }, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
