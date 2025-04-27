
/**
 * Changes made:
 * - 2025-04-27: Added debugging logs for props
 * - 2025-04-27: Enhanced price validation and display
 */

import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ValuationPriceDisplay } from "./ValuationPriceDisplay";
import { LoadingIndicator } from "@/components/common/LoadingIndicator";
import { normalizeTransmission } from "@/utils/validation/validateTypes";
import { XCircle } from "lucide-react";

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
  const navigate = useNavigate();
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
      hasPricingData: reservePrice > 0 || averagePrice > 0,
      transmission: normalizedTransmission,
      mileage,
      hasValuation,
      isLoggedIn,
      apiSource
    });
  }, [make, model, year, vin, reservePrice, averagePrice, transmission, mileage, hasValuation, isLoggedIn, apiSource]);

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <LoadingIndicator message="Processing valuation..." />
      </div>
    );
  }

  // Check if we have all required data
  const hasRequiredData = make && model && year > 0 && reservePrice > 0;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Your Vehicle Valuation</h2>
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-gray-200"
          aria-label="Close"
        >
          <XCircle className="h-6 w-6" />
        </button>
      </div>

      {hasRequiredData ? (
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold">
              {year} {make} {model}
            </h3>
            <div className="text-sm text-gray-600 mt-1">
              <div>VIN: {vin}</div>
              <div className="mt-1">
                Transmission: {normalizedTransmission === "automatic" ? "Automatic" : "Manual"}
              </div>
              <div className="mt-1">Mileage: {mileage.toLocaleString()} km</div>
            </div>
          </div>

          <ValuationPriceDisplay
            reservePrice={reservePrice}
            averagePrice={averagePrice}
            showAveragePrice={true}
            apiSource={apiSource}
            errorDetails={errorDetails}
          />

          <div className="mt-6">
            <Button 
              onClick={onContinue}
              className="w-full"
              variant="default"
            >
              {isLoggedIn ? "Continue to Listing" : "Sign In to Continue"}
            </Button>
            <button
              onClick={onClose}
              className="w-full mt-3 text-sm text-gray-600 hover:underline"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-red-50 rounded-md border border-red-200">
          <p className="text-red-700 font-medium">Incomplete valuation data</p>
          <p className="text-sm text-red-600 mt-1">
            We couldn't retrieve complete valuation information for this vehicle. Please try again or 
            use manual valuation.
          </p>
          
          <div className="mt-6">
            <Button 
              onClick={onClose}
              className="w-full"
              variant="outline"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
