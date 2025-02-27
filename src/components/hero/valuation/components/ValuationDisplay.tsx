
/**
 * Changes made:
 * - 2024-03-19: Initial implementation of valuation display component
 * - 2024-03-19: Added price formatting
 * - 2024-03-19: Updated to display reserve price instead of average price
 * - 2024-03-19: Removed client-side price calculations
 * - 2024-03-19: Removed average price display
 * - 2024-03-19: Fixed reserve price display when value is 0
 */

interface ValuationDisplayProps {
  reservePrice: number;
  averagePrice?: number;
}

export const ValuationDisplay = ({ 
  reservePrice,
  averagePrice
}: ValuationDisplayProps) => {
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
