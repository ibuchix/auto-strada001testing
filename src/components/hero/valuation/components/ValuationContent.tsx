
/**
 * ValuationContent Component
 * - Updated 2025-04-05: Simplified navigation flow with single Button component
 * - Removed redundant navigation mechanisms for clarity and reliability
 * - Updated 2025-04-06: Fixed TypeScript prop interface to include onContinue
 */

import { Button } from "@/components/ui/button";
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
  onContinue: () => void; // Added missing prop
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
  onContinue  // Added missing prop
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
          
          <DirectNavigationButton
            valuationData={valuationData}
            buttonText={isLoggedIn ? "List This Car" : "Sign Up to List Your Car"}
            isDisabled={isLoading}
            onContinue={onContinue}  // Pass the onContinue prop
          />
        </div>
      </div>
    </div>
  );
};
