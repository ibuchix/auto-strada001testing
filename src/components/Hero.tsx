
/**
 * Changes made:
 * - 2024-10-28: Updated to pass valuation context to ValuationForm
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
            Sprzedaj swoje auto
            <span className="block text-primary mt-1">łatwo i pewnie</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-subtitle max-w-2xl mx-auto">
            Aukcje tylko dla certyfikowanych dealerów. 
            Bezpieczny proces sprzedaży bez dodatkowych kosztów.
          </p>
        </div>

        {showValuationForm && (
          <div className="mt-12">
            <ValuationForm context={valuationContext} />
          </div>
        )}
      </div>
    </div>
  );
}
