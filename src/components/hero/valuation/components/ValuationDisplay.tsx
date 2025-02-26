
/**
 * Changes made:
 * - 2024-03-19: Initial implementation of valuation display component
 * - 2024-03-19: Added price formatting
 * - 2024-03-19: Updated to display reserve price instead of average price
 * - 2024-03-19: Removed client-side price calculations
 * - 2024-03-19: Added averagePrice prop to support API response data
 */

interface ValuationDisplayProps {
  reservePrice: number;
  averagePrice?: number;
}

export const ValuationDisplay = ({ 
  reservePrice,
  averagePrice 
}: ValuationDisplayProps) => {
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 text-center">
      <p className="text-sm text-subtitle mb-2">Reserve Price</p>
      <p className="text-4xl font-bold text-primary">
        PLN {reservePrice.toLocaleString()}
      </p>
      {averagePrice && (
        <div className="mt-4">
          <p className="text-sm text-subtitle mb-2">Average Market Price</p>
          <p className="text-2xl font-semibold text-secondary">
            PLN {averagePrice.toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
};
