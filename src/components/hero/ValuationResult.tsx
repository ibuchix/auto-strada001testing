
/**
 * Changes made:
 * - 2025-04-27: Consolidated duplicate ValuationResult components into a single component
 * - 2025-04-27: Enhanced error handling and logging
 * - 2025-04-27: Updated useValuationContinue import path
 * - 2025-04-28: Fixed type incompatibility between different TransmissionType definitions
 * - 2025-04-29: Fixed loading state handling and added console debugging for valuation data
 * - 2025-04-30: Disabled average price display
 * - 2025-04-30: Fixed export to named export
 * - 2025-05-03: Added additional logging to troubleshoot dialog rendering
 * - 2025-05-04: Refactored into smaller components
 * - 2025-05-24: Fixed mileage retrieval and propagation to child components
 * - 2025-05-25: Fixed to use mileage from API data instead of localStorage
 */

import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ValuationContent } from "./valuation/components/ValuationContent";
import { useValuationContinue } from "@/hooks/valuation/useValuationContinue";
import { useState, useEffect } from "react";
import { normalizeValuationData } from "@/utils/valuation/valuationDataNormalizer";
import { normalizeTransmission } from "@/utils/validation/validateTypes";
import { useValuationLogger } from "@/hooks/valuation/useValuationLogger";
import { ValuationErrorDialog } from "./valuation/components/dialogs/ValuationErrorDialog";
import { useValuationErrorDialog } from "@/hooks/valuation/useValuationErrorDialog";
import { ValuationLoadingState } from "./valuation/components/ValuationLoadingState";

interface ValuationResultProps {
  result?: any;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onReset?: () => void;
}

export const ValuationResult = ({ 
  result, 
  open = false,
  onOpenChange,
  onReset
}: ValuationResultProps) => {
  const [isValidatingData, setIsValidatingData] = useState(true);
  const { 
    isOpen: errorDialogOpen,
    setIsOpen: setErrorDialogOpen 
  } = useValuationErrorDialog();
  
  const navigate = useNavigate();
  const { handleContinue, isLoggedIn } = useValuationContinue();

  // Enhanced debug logging
  console.log("ValuationResult component rendering with data:", result);
  
  // Enhanced logging of the valuation result
  useValuationLogger({
    data: result,
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
  }, [result]);
  
  // Get mileage directly from API response data, with fallback to localStorage if needed
  const mileage = result?.data?.mileage || 
                  result?.mileage || 
                  parseInt(localStorage.getItem('tempMileage') || '0', 10);

  // Close the dialog when requested
  const onClose = () => {
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  // Handle retry action
  const onRetry = () => {
    if (onReset) {
      onReset();
    }
  };

  // Show loading indicator while validating
  if (!result) {
    console.log("No valuation result provided, showing loading indicator");
    return <ValuationLoadingState message="Processing valuation..." />;
  }
  
  if (isValidatingData) {
    console.log("Still validating data, showing loading indicator");
    return <ValuationLoadingState message="Processing valuation data..." />;
  }
  
  console.log("Proceeding with data validation and display", {
    hasError: !!result.error,
    hasNoData: !!result.noData,
    make: result.make,
    model: result.model,
    year: result.year,
    reservePrice: result.reservePrice,
    mileage: mileage // Log the mileage value
  });
  
  // Normalize the valuation data
  const normalizedData = normalizeValuationData(
    result,
    result.vin || '',
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
        isOpen={open}
        onClose={() => {
          setErrorDialogOpen(false);
          onClose();
        }}
        onRetry={() => {
          setErrorDialogOpen(false);
          onRetry();
        }}
        onManualValuation={() => {
          setErrorDialogOpen(false);
          if (isVinError) {
            navigate('/manual-valuation');
          } else {
            onRetry();
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
    averagePrice: normalizedData.averagePrice,
    mileage: mileage // Log the mileage again to confirm it's being passed
  });

  // Only show valuation content if we have valid data
  return (
    <ValuationContent
      make={normalizedData.make}
      model={normalizedData.model}
      year={normalizedData.year}
      vin={normalizedData.vin}
      transmission={compatibleTransmission}
      mileage={mileage} // Pass the mileage value explicitly
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
