
/**
 * Changes made:
 * - 2024-10-28: Updated to pass valuation context to ValuationForm
 * - 2024-10-29: Fixed ValuationForm props interface
 * - 2024-10-30: Ensured all text content is in English
 */

import { BackgroundPattern } from "./hero/BackgroundPattern";
import { ValuationForm } from "./hero/ValuationForm";

interface HeroProps {
  showValuationForm?: boolean;
  valuationContext?: 'home' | 'seller';
}

export const Hero = ({ 
  showValuationForm = true,
  valuationContext = 'home'
}: HeroProps) => {
  return (
    <div className="relative overflow-hidden bg-white">
      <BackgroundPattern />
      
      <div className="relative pt-32 pb-20 mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-dark">
            Sell your car
            <span className="block text-primary mt-1">easily and confidently</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-subtitle max-w-2xl mx-auto">
            Auctions only for certified dealers.
            Secure selling process with no additional costs.
          </p>
        </div>

        {showValuationForm && (
          <div className="mt-12">
            <ValuationForm valuationContext={valuationContext} />
          </div>
        )}
      </div>
    </div>
  );
}
