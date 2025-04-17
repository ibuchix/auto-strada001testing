
/**
 * ValuationContent Component
 * - Updated 2025-04-17: Refactored to use separate components for better organization
 */

import { Button } from "@/components/ui/button";
import { VehicleInfoDisplay } from "./VehicleInfoDisplay";
import { PriceInfoDisplay } from "./PriceInfoDisplay";
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
  onClose,
  onContinue
}: ValuationContentProps) => {
  return (
    <div className="p-6 bg-white rounded-lg max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Valuation Result</h2>
      
      <VehicleInfoDisplay
        make={make}
        model={model}
        year={year}
        transmission={transmission}
        mileage={mileage}
      />
      
      {hasValuation && reservePrice && (
        <PriceInfoDisplay
          reservePrice={reservePrice}
          averagePrice={averagePrice}
        />
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
