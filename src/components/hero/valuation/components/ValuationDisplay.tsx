
/**
 * Changes made:
 * - 2024-03-19: Initial implementation of valuation display component
 * - 2024-03-19: Added price formatting
 * - 2024-03-19: Updated to display reserve price instead of average price
 */

interface ValuationDisplayProps {
  averagePrice: number;
  reservePrice?: number;
}

export const ValuationDisplay = ({ averagePrice, reservePrice }: ValuationDisplayProps) => {
  console.log('ValuationDisplay - Rendering with prices:', { averagePrice, reservePrice });
  
  // Display the reserve price if available, otherwise fall back to average price
  const displayPrice = reservePrice || averagePrice;
  
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 text-center">
      <p className="text-sm text-subtitle mb-2">Reserve Price</p>
      <p className="text-4xl font-bold text-primary">
        PLN {displayPrice.toLocaleString()}
      </p>
    </div>
  );
};
