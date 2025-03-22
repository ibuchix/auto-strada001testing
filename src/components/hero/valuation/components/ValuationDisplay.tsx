
/**
 * Changes made:
 * - 2024-03-19: Added support for server-calculated reserve price with client fallback
 * - 2024-03-19: Improved loading and error states
 * - 2024-03-19: Added proper type checking for price values
 * - 2024-07-20: Enhanced error display with clearer messages and retry option
 * - 2024-08-02: Removed average price display to prevent sellers from seeing it
 */

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface ValuationDisplayProps {
  reservePrice: number;
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

  // Only show "No valuation available" if reserve price is 0 or undefined
  if (!reservePrice) {
    return (
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 text-center">
        <p className="text-sm text-subtitle mb-2">Valuation</p>
        <p className="text-4xl font-bold text-primary">
          No valuation available
        </p>
      </div>
    );
  }

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 text-center">
      <p className="text-sm text-subtitle mb-2">Reserve Price</p>
      <p className="text-4xl font-bold text-primary">
        PLN {Math.max(0, reservePrice).toLocaleString()}
      </p>
      {/* Removed the averagePrice display */}
    </div>
  );
};
