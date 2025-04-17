
/**
 * Changes made:
 * - 2024-03-19: Initial implementation of valuation result display
 * - 2024-03-19: Added user authentication checks
 * - 2024-03-19: Implemented seller role validation
 * - 2024-03-19: Updated to pass reserve price to ValuationDisplay
 * - 2024-03-19: Refactored into smaller components
 * - 2024-03-19: Fixed type error in props passed to ValuationContent
 * - 2024-03-19: Added averagePrice to ValuationContent props
 * - 2024-03-19: Fixed valuation data being passed incorrectly
 * - 2024-08-05: Enhanced error handling and improved manual valuation flow
 * - 2026-04-15: Improved resilience for partial data and enhanced UI feedback
 * - 2025-04-08: Added ability to use partial data when essential fields are available
 * - 2025-04-17: Fixed import paths to match project structure
 * - 2025-04-17: Enhanced data validation and improved debug logging
 * - 2025-04-17: Fixed incorrect display of "Unknown Vehicle" when valid data exists
 * - 2025-04-17: Fixed data extraction from external API responses
 */

import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ValuationContent } from "./ValuationContent";
import { useValuationContinue } from "../hooks/useValuationContinue";
import { useState, useEffect } from "react";
import { LoadingIndicator } from "@/components/common/LoadingIndicator";
import { ValuationErrorHandler } from "./ValuationErrorHandler";
import { ValuationErrorDialog } from "./dialogs/ValuationErrorDialog";
import { useValuationErrorDialog } from "@/hooks/valuation/useValuationErrorDialog";
import { normalizeValuationData, validateValuationData } from "../utils/valuationDataNormalizer";

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
  };
  onContinue: () => void;
  onClose: () => void;
  onRetry?: () => void;
  errorDialogOpen?: boolean;
  setErrorDialogOpen?: (isOpen: boolean) => void;
}

export const ValuationResult = ({ 
  valuationResult, 
  onContinue, 
  onClose,
  onRetry,
  errorDialogOpen: externalErrorDialogOpen,
  setErrorDialogOpen: externalSetErrorDialogOpen
}: ValuationResultProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { 
    isOpen: internalErrorDialogOpen,
    setIsOpen: internalSetErrorDialogOpen,
    handleClose: handleErrorClose,
    handleRetry: handleErrorRetry 
  } = useValuationErrorDialog();
  
  // Use external state if provided, otherwise use internal state
  const errorDialogOpen = externalErrorDialogOpen !== undefined ? externalErrorDialogOpen : internalErrorDialogOpen;
  const setErrorDialogOpen = externalSetErrorDialogOpen || internalSetErrorDialogOpen;
  
  // For more comprehensive debugging
  useEffect(() => {
    console.log('ValuationResult received raw data:', {
      hasResult: !!valuationResult,
      hasError: !!valuationResult?.error,
      noData: !!valuationResult?.noData,
      make: valuationResult?.make,
      model: valuationResult?.model,
      year: valuationResult?.year,
      valuation: valuationResult?.valuation,
      reservePrice: valuationResult?.reservePrice,
      rawData: JSON.stringify(valuationResult).substring(0, 500)
    });
  }, [valuationResult]);
  
  // Normalize and process data immediately
  const [normalizedData, setNormalizedData] = useState<any>({});
  
  useEffect(() => {
    if (!valuationResult) return;
    
    // Normalize and validate the result to handle different data formats
    const normalized = normalizeValuationData(valuationResult);
    setNormalizedData(normalized);
    
    // Check if we have valid vehicle identification (make AND model)
    const hasValidVehicle = normalized.make && normalized.model;
    
    // Show error dialog only if: explicit error OR noData flag and missing vehicle info
    const shouldShowError = (
      !!valuationResult.error || 
      (valuationResult.noData && !hasValidVehicle)
    );
    
    console.log('Validating valuation result:', {
      hasError: !!valuationResult.error,
      noData: !!valuationResult.noData,
      hasValidVehicle,
      shouldShowError,
      make: normalized.make,
      model: normalized.model,
      valuation: normalized.valuation,
      reservePrice: normalized.reservePrice
    });
    
    if (shouldShowError) {
      setErrorDialogOpen(true);
    } else if (hasValidVehicle) {
      // We have valid data, make sure dialog is closed
      setErrorDialogOpen(false);
    }
  }, [valuationResult, setErrorDialogOpen]);

  const navigate = useNavigate();
  const { handleContinue, isLoggedIn } = useValuationContinue();
  const [isValidatingData, setIsValidatingData] = useState(true);
  
  // Validate data on mount with a slight delay to improve perceived responsiveness
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsValidatingData(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  if (!valuationResult) {
    return (
      <div className="p-6 text-center">
        <LoadingIndicator message="Preparing valuation data..." />
      </div>
    );
  }

  // Still validating - show a loading indicator
  if (isValidatingData) {
    return (
      <div className="p-6 text-center">
        <LoadingIndicator message="Processing valuation..." />
      </div>
    );
  }

  const mileage = parseInt(localStorage.getItem('tempMileage') || '0');
  
  // Check if we have a real error condition that should trigger the error dialog
  const hasError = !!valuationResult.error;
  const hasMissingVehicleInfo = !normalizedData.make || !normalizedData.model;
  const shouldShowError = hasError || (valuationResult?.noData && hasMissingVehicleInfo);
  
  // Check for valid valuation data
  const hasValuation = !hasError && (
    normalizedData.valuation !== undefined || 
    normalizedData.reservePrice !== undefined
  );

  // If we have an error that should be shown, display the error dialog
  if (shouldShowError) {
    console.log('Showing ValuationErrorDialog due to:', {
      hasError,
      hasMissingVehicleInfo,
      noData: valuationResult?.noData,
      errorMessage: valuationResult.error || "No data found for this VIN"
    });
    
    return (
      <ValuationErrorDialog
        isOpen={errorDialogOpen}
        onClose={() => {
          handleErrorClose();
          onClose();
        }}
        onRetry={() => {
          handleErrorRetry();
          if (onRetry) onRetry();
        }}
        error={valuationResult.error || "No data found for this VIN"}
      />
    );
  }

  // Use the normalized data which contains properly extracted values
  console.log('Rendering ValuationContent with normalized data:', {
    make: normalizedData.make,
    model: normalizedData.model,
    year: normalizedData.year,
    valuation: normalizedData.valuation,
    reservePrice: normalizedData.reservePrice,
    hasValuation
  });

  return (
    <ValuationContent
      make={normalizedData.make}
      model={normalizedData.model}
      year={normalizedData.year}
      vin={normalizedData.vin || valuationResult.vin || ''}
      transmission={normalizedData.transmission || valuationResult.transmission || 'manual'}
      mileage={mileage}
      reservePrice={normalizedData.reservePrice}
      averagePrice={normalizedData.averagePrice}
      hasValuation={hasValuation}
      isLoggedIn={isLoggedIn}
      onClose={onClose}
      onContinue={() => handleContinue(normalizedData)}
    />
  );
};
