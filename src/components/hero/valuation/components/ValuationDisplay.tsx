
/**
 * Changes made:
 * - 2024-03-19: Added support for server-calculated reserve price with client fallback
 * - 2024-03-19: Improved loading and error states
 * - 2024-03-19: Added proper type checking for price values
 */

interface ValuationDisplayProps {
  reservePrice: number;
  averagePrice?: number;
  isLoading?: boolean;
  error?: string;
}

export const ValuationDisplay = ({ 
  reservePrice,
  averagePrice,
  isLoading,
  error
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
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  // Only show "No valuation available" if both prices are 0 or undefined
  if (!reservePrice && !averagePrice) {
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
    </div>
  );
};
