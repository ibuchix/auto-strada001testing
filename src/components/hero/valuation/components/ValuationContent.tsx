
/**
 * Changes made:
 * - 2025-04-27: Added debugging logs for props
 * - 2025-04-27: Enhanced price validation and display
 * - 2025-04-29: Fixed display issues and added more detailed debugging
 * - 2025-04-30: Removed duplicate close button and market price display
 * - 2025-05-03: Completely removed header close button to fix duplicate buttons issue
 * - 2025-05-04: Refactored to use smaller component pieces
 */

import React, { useEffect } from "react";
import { ValuationPriceDisplay } from "./ValuationPriceDisplay";
import { normalizeTransmission } from "@/utils/validation/validateTypes";
import { ValuationResultHeader } from "./ValuationResultHeader";
import { VehicleInformation } from "./VehicleInformation";
import { ValuationActions } from "./ValuationActions";
import { IncompleteDataDisplay } from "./IncompleteDataDisplay";
import { ValuationLoadingState } from "./ValuationLoadingState";

interface ValuationContentProps {
  make: string;
  model: string;
  year: number;
  vin: string;
  transmission: "manual" | "automatic";
  mileage: number;
  reservePrice: number;
  averagePrice?: number;
  hasValuation: boolean;
  isLoading?: boolean;
  isLoggedIn: boolean;
  apiSource?: string;
  errorDetails?: string;
  onClose: () => void;
  onContinue: () => void;
}

export const ValuationContent: React.FC<ValuationContentProps> = ({
  make,
  model,
  year,
  vin,
  transmission,
  mileage,
  reservePrice,
  averagePrice,
  hasValuation,
  isLoading = false,
  isLoggedIn,
  apiSource = "auto_iso",
  errorDetails,
  onClose,
  onContinue,
}) => {
  const normalizedTransmission = normalizeTransmission(transmission);

  // Debug logging
  useEffect(() => {
    console.log('ValuationContent received props:', {
      make, 
      model, 
      year, 
      vin,
      reservePrice,
      averagePrice,
      hasPricingData: reservePrice > 0,
      transmission: normalizedTransmission,
      mileage,
      hasValuation,
      isLoggedIn,
      apiSource
    });
  }, [make, model, year, vin, reservePrice, averagePrice, transmission, mileage, hasValuation, isLoggedIn, apiSource]);

  if (isLoading) {
    return <ValuationLoadingState message="Processing valuation..." />;
  }

  // Check if we have all required data
  const hasRequiredData = make && model && year > 0 && reservePrice > 0;
  
  console.log("ValuationContent rendering with hasRequiredData:", hasRequiredData);

  return (
    <div className="p-6">
      <ValuationResultHeader title="Your Vehicle Valuation" />

      {hasRequiredData ? (
        <div>
          <VehicleInformation
            make={make}
            model={model}
            year={year}
            vin={vin}
            transmission={normalizedTransmission}
            mileage={mileage}
          />

          <ValuationPriceDisplay
            reservePrice={reservePrice}
            averagePrice={averagePrice}
            showAveragePrice={false} // Never show average/market price
            apiSource={apiSource}
            errorDetails={errorDetails}
          />

          <ValuationActions
            isLoggedIn={isLoggedIn}
            onContinue={onContinue}
            onClose={onClose}
          />
        </div>
      ) : (
        <IncompleteDataDisplay
          make={make}
          model={model}
          year={year}
          reservePrice={reservePrice}
          onClose={onClose}
        />
      )}
    </div>
  );
};
