
/**
 * ValuationContent Component
 * - Updated 2025-04-05: Simplified navigation flow with single Button component
 * - Removed redundant navigation mechanisms for clarity and reliability
 * - Updated 2025-04-06: Fixed TypeScript prop interface to include onContinue
 * - Updated 2025-04-17: Fixed component to properly display vehicle data and pricing
 */

import { Button } from "@/components/ui/button";
import { ValuationPriceDisplay } from "./ValuationPriceDisplay";
import { CarDetailsSection } from "./CarDetailsSection";
import { ContactInfo } from "./ContactInfo";
import { formatPrice } from "@/utils/priceExtractor";

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
  // Log the data being displayed for debugging
  console.log('ValuationContent rendering with:', {
    make, model, year, reservePrice, averagePrice, hasValuation
  });

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
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium mb-2">Your Vehicle Valuation</h3>
          
          {averagePrice && (
            <div className="mb-3">
              <span className="text-gray-700">Market Average: </span>
              <span className="font-semibold">{formatPrice(averagePrice)}</span>
            </div>
          )}
          
          <div className="mb-2">
            <span className="text-gray-700">Reserve Price: </span>
            <span className="text-lg font-bold text-secondary">{formatPrice(reservePrice)}</span>
          </div>
          
          <p className="text-sm text-gray-600 mt-2">
            This is the minimum price your vehicle will be listed for in our auction.
          </p>
        </div>
      )}
      
      <div className="mt-6 flex flex-col gap-4">
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-md">
          <p className="text-sm text-blue-800">
            Great news! Your {year} {make} {model} can be listed for auction.
          </p>
        </div>
        
        <ContactInfo />

        <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={onContinue} className="bg-secondary hover:bg-secondary/90 text-white">
            {isLoggedIn ? "List My Car" : "Sign Up to Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
};
