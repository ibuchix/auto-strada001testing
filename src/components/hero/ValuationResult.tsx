/**
 * Changes made:
 * - 2025-04-27: Consolidated duplicate ValuationResult components into a single component
 * - 2025-04-27: Enhanced error handling and logging
 * - 2025-04-27: Updated useValuationContinue import path
 * - 2025-04-28: Fixed type incompatibility between different TransmissionType definitions
 * - 2025-04-29: Fixed loading state handling and added console debugging for valuation data
 * - 2025-04-30: Disabled average price display
 */

import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ValuationContent } from "./valuation/components/ValuationContent";
import { useValuationContinue } from "@/hooks/valuation/useValuationContinue";
import { useState, useEffect } from "react";
import { LoadingIndicator } from "@/components/common/LoadingIndicator";
import { ValuationErrorDialog } from "./valuation/components/dialogs/ValuationErrorDialog";
import { useValuationErrorDialog } from "@/hooks/valuation/useValuationErrorDialog";
import { normalizeValuationData } from "@/utils/valuation/valuationDataNormalizer";
import { normalizeTransmission } from "@/utils/validation/validateTypes";
import { useValuationLogger } from "@/hooks/valuation/useValuationLogger";

interface ValuationResultProps {
  valuationResult: {
    make?: string;
    model?: string;
    year?: number;
    vin?: string;
    transmission?: string;
    valuation?: number;
    averagePrice?: number;
    reservePrice?: number;
    isExisting?: boolean;
    error?: string;
    noData?: boolean;
    apiSource?: string;
    errorDetails?: string;
    data?: any; // For nested data structure
    functionResponse?: any; // For nested functionResponse
  } | null;
  onContinue: () => void;
  onClose: () => void;
  onRetry?: () => void;
}

export const ValuationResult = ({ 
  valuationResult, 
  onContinue, 
  onClose,
  onRetry 
}: ValuationResultProps) => {
  const [isValidatingData, setIsValidatingData] = useState(true);
  const { 
    isOpen: errorDialogOpen,
    setIsOpen: setErrorDialogOpen 
  } = useValuationErrorDialog();
  
  const navigate = useNavigate();
  const { handleContinue, isLoggedIn } = useValuationContinue();

  // Enhanced debug logging
  console.log("ValuationResult component rendering with data:", valuationResult);
  
  // Enhanced logging of the valuation result
  useValuationLogger({
    data: valuationResult,
    stage: 'ValuationResult-Initial',
    enabled: true,
    inspectNested: true
  });
  
  // Set isValidatingData to false after render to allow UI to update
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsValidatingData(false);
      console.log("Validation data state set to false, UI should update");
    }, 500);
    
    return () => clearTimeout(timer);
  }, [valuationResult]);
  
  // Get mileage from localStorage
  const mileage = parseInt(localStorage.getItem('tempMileage') || '0', 10);

  // Show loading indicator while validating
  if (!valuationResult) {
    console.log("No valuation result provided, showing loading indicator");
    return (
      <div className="p-6 text-center">
        <LoadingIndicator message="Processing valuation..." />
      </div>
    );
  }
  
  if (isValidatingData) {
    console.log("Still validating data, showing loading indicator");
    return (
      <div className="p-6 text-center">
        <LoadingIndicator message="Processing valuation data..." />
      </div>
    );
  }
  
  console.log("Proceeding with data validation and display", {
    hasError: !!valuationResult.error,
    hasNoData: !!valuationResult.noData,
    make: valuationResult.make,
    model: valuationResult.model,
    year: valuationResult.year,
    reservePrice: valuationResult.reservePrice
  });
  
  // Normalize the valuation data
  const normalizedData = normalizeValuationData(
    valuationResult,
    valuationResult.vin || '',
    mileage
  );

  // Show error dialog if validation failed
  if (normalizedData.error || normalizedData.noData) {
    // Determine if the error is related to VIN not found or price data missing
    const isVinError = normalizedData.noData || (normalizedData.error && normalizedData.error.toLowerCase().includes('vin'));
    let errorMessage: string;
    let errorDescription: string;
    
    if (isVinError) {
      errorMessage = "Vehicle not found";
      errorDescription = "This VIN couldn't be found in our database. You may proceed with manual listing.";
    } else if (!normalizedData.make || !normalizedData.model || !normalizedData.year) {
      errorMessage = "Vehicle information incomplete";
      errorDescription = "We couldn't retrieve complete information for this vehicle. Please check the VIN and try again.";
    } else if (normalizedData.reservePrice <= 0) {
      errorMessage = "Price information unavailable";
      errorDescription = "We found your vehicle but couldn't retrieve pricing information. Please try again or contact support.";
    } else {
      errorMessage = normalizedData.error || "Valuation error";
      errorDescription = "An error occurred during the valuation process. Please try again.";
    }
    
    console.log("Showing error dialog", { errorMessage, errorDescription });
    
    return (
      <ValuationErrorDialog
        isOpen={true}
        onClose={() => {
          setErrorDialogOpen(false);
          onClose();
        }}
        onRetry={() => {
          setErrorDialogOpen(false);
          if (onRetry) onRetry();
        }}
        onManualValuation={() => {
          setErrorDialogOpen(false);
          if (isVinError) {
            navigate('/manual-valuation');
          } else {
            if (onRetry) onRetry();
            else onClose();
          }
        }}
        error={errorMessage}
        description={errorDescription}
        showManualOption={isVinError}
      />
    );
  }

  // Convert the transmission type to match the ValuationContent component's expected format
  // This ensures compatibility between different TransmissionType definitions in the codebase
  const compatibleTransmission = normalizedData.transmission === 'manual' ? 'manual' : 'automatic';
  
  console.log("Showing valuation content with normalized data:", {
    make: normalizedData.make,
    model: normalizedData.model,
    year: normalizedData.year,
    reservePrice: normalizedData.reservePrice,
    averagePrice: normalizedData.averagePrice
  });

  // Only show valuation content if we have valid data
  return (
    <ValuationContent
      make={normalizedData.make}
      model={normalizedData.model}
      year={normalizedData.year}
      vin={normalizedData.vin}
      transmission={compatibleTransmission}
      mileage={mileage}
      reservePrice={normalizedData.reservePrice}
      averagePrice={normalizedData.averagePrice || 0}
      hasValuation={true}
      isLoggedIn={isLoggedIn}
      apiSource={normalizedData.apiSource}
      errorDetails={normalizedData.errorDetails}
      onClose={onClose}
      onContinue={() => handleContinue(normalizedData)}
    />
  );
};
