
/**
 * Listing Card Price Component
 * Created: 2025-05-22
 * Purpose: Display formatted reserve price for a listing
 * Updated: 2025-06-01 - Improved error handling and messaging for missing reserve price
 */

import { formatPrice } from '@/utils/valuation/reservePriceCalculator';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ListingCardPriceProps {
  price: number | null;
  isCalculating: boolean;
}

export const ListingCardPrice = ({ price, isCalculating }: ListingCardPriceProps) => {
  if (isCalculating) {
    return <p className="text-primary font-semibold mt-1">Calculating...</p>;
  }
  
  if (price === null) {
    return (
      <div className="flex flex-col gap-1 mt-1">
        <div className="flex items-center gap-1 text-destructive">
          <AlertCircle size={14} className="inline" />
          <p className="text-sm font-medium">Reserve price unavailable</p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          className="text-xs mt-1 h-7" 
          onClick={() => window.open('mailto:support@auto-strada.com?subject=Reserve Price Issue')}
        >
          Contact Support
        </Button>
      </div>
    );
  }
  
  return (
    <p className="text-primary font-semibold mt-1">
      {formatPrice(price, 'PLN')}
    </p>
  );
};
