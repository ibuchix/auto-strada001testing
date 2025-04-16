
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
 * - 2025-04-18: Improved error dialog integration with proper state management
 * - 2025-04-19: Fixed improper error detection causing valid VINs to show manual valuation
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
  
  // Check for errors as soon as we get results - IMPORTANT: only set error dialog to true if there is a real error
  useEffect(() => {
    // Only show error dialog for genuine errors, not for valid results with noData flag
    const hasGenuineError = valuationResult?.error && !valuationResult?.make;
    const hasNoDataWithoutValidResults = valuationResult?.noData && 
                                        (!valuationResult?.make || !valuationResult?.model);
    
    if (hasGenuineError || hasNoDataWithoutValidResults) {
      console.log('Setting error dialog open due to genuine error condition:', { 
        error: valuationResult?.error, 
        noData: valuationResult?.noData,
        hasMake: !!valuationResult?.make,
        hasModel: !!valuationResult?.model
      });
      setErrorDialogOpen(true);
    } else if (valuationResult?.make && valuationResult?.model) {
      // We have valid data, make sure dialog is closed
      console.log('Valid data detected, ensuring error dialog is closed');
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
  
  // IMPORTANT: Changed error detection logic to properly identify genuine errors
  const hasError = !!valuationResult.error && !valuationResult.make;
  
  // Check for valid valuation data - must have EITHER valuation OR reservePrice
  const hasValuation = !hasError && (
    valuationResult.valuation !== undefined || 
    valuationResult.reservePrice !== undefined
  );

  // Check if we have the minimum required data for a successful result
  const hasMinimumRequiredData = !!valuationResult.make && !!valuationResult.model;
  
  // Only show error dialog for genuine errors, not when we have valid data with the noData flag
  if (hasError || (valuationResult?.noData && !hasMinimumRequiredData)) {
    console.log('Rendering ValuationErrorDialog due to genuine error:', { 
      hasError,
      noData: valuationResult?.noData,
      hasMinimumRequiredData,
      error: valuationResult.error || "No data found for this VIN" 
    });
    
    return (
      <ValuationErrorDialog
        isOpen={errorDialogOpen}
        onClose={() => {
          console.log('ValuationErrorDialog onClose called');
          handleErrorClose();
          onClose();
        }}
        onRetry={() => {
          console.log('ValuationErrorDialog onRetry called');
          handleErrorRetry();
          if (onRetry) onRetry();
        }}
        error={valuationResult.error || "No data found for this VIN"}
      />
    );
  }

  // If we reach here, we have valid data - use fallback values for any missing properties
  console.log('Rendering ValuationContent with data:', {
    make: valuationResult.make,
    model: valuationResult.model,
    year: valuationResult.year,
    hasValuation
  });
  
  const normalizedResult = {
    make: valuationResult.make || 'Unknown',
    model: valuationResult.model || 'Vehicle',
    year: valuationResult.year || new Date().getFullYear(),
    vin: valuationResult.vin || '',
    transmission: valuationResult.transmission || 'manual',
    reservePrice: valuationResult.reservePrice || valuationResult.valuation,
    averagePrice: valuationResult.averagePrice
  };

  return (
    <ValuationContent
      make={normalizedResult.make}
      model={normalizedResult.model}
      year={normalizedResult.year}
      vin={normalizedResult.vin}
      transmission={normalizedResult.transmission}
      mileage={mileage}
      reservePrice={normalizedResult.reservePrice}
      averagePrice={normalizedResult.averagePrice}
      hasValuation={hasValuation}
      isLoggedIn={isLoggedIn}
      onClose={onClose}
      onContinue={() => handleContinue(valuationResult)}
    />
  );
};
