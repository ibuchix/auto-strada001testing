
/**
 * Changes made:
 * - 2024-03-19: Initial implementation of valuation display component
 * - 2024-03-19: Added price formatting
 * - 2024-03-19: Updated to display reserve price instead of average price
 * - 2024-03-19: Removed client-side price calculations
 */

interface ValuationDisplayProps {
  reservePrice: number;
}

export const ValuationDisplay = ({ reservePrice }: ValuationDisplayProps) => {
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 text-center">
      <p className="text-sm text-subtitle mb-2">Reserve Price</p>
      <p className="text-4xl font-bold text-primary">
        PLN {reservePrice.toLocaleString()}
      </p>
    </div>
  );
};
