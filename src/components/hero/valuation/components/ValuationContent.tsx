
/**
 * ValuationContent Component
 * - Added 2025-04-12: Updated to use DirectNavigationButton for more reliable navigation
 * - Simplified navigation flow for more consistent user experience
 */

import { Button } from "@/components/ui/button";
import { ContinueButton } from "./buttons/ContinueButton";
import { DirectNavigationButton } from "./buttons/DirectNavigationButton";
import { ValuationPriceDisplay } from "./ValuationPriceDisplay";
import { CarDetailsSection } from "./CarDetailsSection";
import { ContactInfo } from "./ContactInfo";

interface ValuationContentProps {
  make: string;
  model: string;
  year: number;
  vin: string;
  transmission: string;
  mileage: number;
  reservePrice?: number | null;
  averagePrice?: number | null;
  hasValuation: boolean;
  isLoggedIn: boolean;
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
  onClose: () => void;
  onContinue: () => void;
}

export const ValuationContent = ({
  make,
  model,
  year,
  vin,
  transmission,
  mileage,
  reservePrice,
  averagePrice,
  hasValuation,
  isLoggedIn,
  isLoading,
  error,
  onRetry,
  onClose,
  onContinue
}: ValuationContentProps) => {
  const valuationData = {
    make,
    model,
    year,
    vin,
    transmission,
    mileage,
    reservePrice,
    averagePrice
  };

  return (
    <div className="p-6 bg-white rounded-lg max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Valuation Result</h2>
      
      <CarDetailsSection 
        make={make} 
        model={model} 
        year={year} 
        transmission={transmission} 
        mileage={mileage} 
      />
      
      {hasValuation && reservePrice && (
        <ValuationPriceDisplay reservePrice={reservePrice} showAveragePrice={false} />
      )}
      
      <div className="mt-6 flex flex-col gap-4">
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-md">
          <p className="text-sm text-blue-800">
            Great news! Your {year} {make} {model} can be listed for auction.
          </p>
        </div>
        
        <ContactInfo />

        <div className="flex flex-col sm:flex-row justify-between gap-4 mt-4">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          
          {/* Use both buttons for maximum reliability */}
          <div className="hidden">
            {/* Original button - hidden but still functional for backward compatibility */}
            <ContinueButton 
              isLoggedIn={isLoggedIn} 
              onClick={onContinue} 
              isLoading={isLoading} 
            />
          </div>
          
          {/* New direct navigation button - primary interaction point */}
          <DirectNavigationButton
            isLoggedIn={isLoggedIn}
            valuationData={valuationData}
            buttonText={isLoggedIn ? "List This Car" : "Sign Up to List Your Car"}
            isDisabled={isLoading}
          />
        </div>
      </div>
    </div>
  );
};
