
/**
 * ValuationContent Component
 * Updated: 2025-05-18 - Added price calculation verification feature
 * Updated: 2025-05-20 - Fixed import for ValuationVehicleDetails component
 * Updated: 2025-05-20 - Enhanced price verification with detailed calculation check
 * Updated: 2025-05-21 - Modified to correctly pass base price and calculate reserve price
 * Updated: 2025-05-22 - Ensured mileage is passed to price display component
 */

import { ValuationPriceDisplay } from "./ValuationPriceDisplay";
import { ValuationVehicleDetails } from "./ValuationVehicleDetails";
import { ValuationVerification } from "./ValuationVerification";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

interface ValuationContentProps {
  make?: string;
  model?: string;
  year?: number;
  vin?: string;
  transmission?: "manual" | "automatic";
  mileage?: number;
  reservePrice?: number;
  averagePrice?: number;
  hasValuation?: boolean;
  isLoggedIn?: boolean;
  apiSource?: string;
  errorDetails?: string;
  onClose?: () => void;
  onContinue?: () => void;
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
  hasValuation = false,
  isLoggedIn = false,
  apiSource = "auto_iso",
  errorDetails,
  onClose,
  onContinue,
}: ValuationContentProps) => {
  // Check if we have enough data to show content
  const hasRequiredData = !!(make && model && year);
  
  useEffect(() => {
    console.log("ValuationContent rendering with hasRequiredData:", hasRequiredData);
  }, [hasRequiredData]);
  
  useEffect(() => {
    console.log("ValuationContent received props:", {
      make,
      model,
      year,
      vin,
      reservePrice,
      averagePrice,
      mileage,
      hasPricingData: !!reservePrice && reservePrice > 0,
      transmission,
      hasValuation,
      isLoggedIn,
      apiSource
    });
  }, [make, model, year, vin, reservePrice, averagePrice, transmission, mileage, hasValuation, isLoggedIn, apiSource]);

  // Prepare data for valuation verification
  // Using averagePrice as basePrice for our verification and calculation
  const valuationData = {
    make,
    model,
    year,
    vin,
    transmission,
    mileage,
    reservePrice,
    averagePrice,
    basePrice: averagePrice, // Use averagePrice as basePrice for our calculations
  };

  return (
    <Dialog open={hasRequiredData} onOpenChange={() => onClose && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Your Vehicle Valuation</DialogTitle>
          <DialogDescription className="text-center text-xl font-bold mt-2">
            {year} {make?.toUpperCase()} {model?.toUpperCase()}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col space-y-2">
          <ValuationVehicleDetails
            vin={vin}
            transmission={transmission || "manual"}
            mileage={mileage || 0}
          />
          
          <ValuationPriceDisplay
            reservePrice={reservePrice || 0}
            showAveragePrice={false}
            averagePrice={averagePrice} // Pass averagePrice to be used as basePrice
            mileage={mileage} // Pass mileage to price display
            errorDetails={errorDetails}
            apiSource={apiSource}
          />
          
          <ValuationVerification valuationData={valuationData} />
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-3">
          <Button type="submit" className="w-full" onClick={onContinue}>
            Continue to Listing
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={onClose}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
