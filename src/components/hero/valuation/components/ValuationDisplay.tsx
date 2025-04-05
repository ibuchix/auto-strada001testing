
/**
 * Changes made:
 * - 2025-04-06: Removed excessive debug logging
 * - 2025-04-06: Simplified component with environment-aware debugging
 * - 2025-04-06: Improved error resilience and visual feedback
 */

import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle, Info } from "lucide-react";
import { useState } from "react";
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
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const isDevMode = process.env.NODE_ENV === 'development';
  
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

  // Enhanced validation of reserve price
  const hasValidPrice = (
    reservePrice !== undefined && 
    reservePrice !== null && 
    !isNaN(Number(reservePrice)) && 
    Number(reservePrice) > 0
  );
                       
  if (!hasValidPrice) {
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
      </div>
    );
  }

  // Ensure we have a positive number and format it
  const priceValue = Math.max(0, Number(reservePrice));
  const formattedPrice = new Intl.NumberFormat('pl-PL').format(priceValue);
  
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 text-center">
      <p className="text-sm text-subtitle mb-2">Reserve Price</p>
      <p className="text-4xl font-bold text-primary">
        PLN {formattedPrice}
      </p>
      
      {/* Debug toggle button - only visible in development */}
      {isDevMode && (
        <div className="mt-4 pt-2 border-t border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-subtitle flex items-center gap-1"
            onClick={() => setShowDebugInfo(!showDebugInfo)}
          >
            {showDebugInfo ? "Hide Debug" : "Show Debug"}
          </Button>
          
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
}
