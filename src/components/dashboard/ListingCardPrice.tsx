
/**
 * Listing Card Price Component
 * Created: 2025-05-22
 * Purpose: Display formatted reserve price for a listing
 */

import { formatPrice } from '@/utils/valuation/reservePriceCalculator';

interface ListingCardPriceProps {
  price: number | null;
  isCalculating: boolean;
}

export const ListingCardPrice = ({ price, isCalculating }: ListingCardPriceProps) => {
  if (isCalculating) {
    return <p className="text-primary font-semibold mt-1">Calculating...</p>;
  }
  
  if (price === null) {
    return <p className="text-primary font-semibold mt-1">Price unavailable</p>;
  }
  
  return (
    <p className="text-primary font-semibold mt-1">
      {formatPrice(price, 'PLN')}
    </p>
  );
};
