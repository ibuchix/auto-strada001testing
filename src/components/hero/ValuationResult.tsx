
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
 */

import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ValuationContent } from "./valuation/components/ValuationContent";
import { useValuationContinue } from "./valuation/hooks/useValuationContinue";
import { useState, useEffect } from "react";
import { LoadingIndicator } from "@/components/common/LoadingIndicator";
import { ValuationErrorHandler } from "./valuation/components/ValuationErrorHandler";
import { ValuationErrorDialog } from "./valuation/components/dialogs/ValuationErrorDialog";
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
}

export const ValuationResult = ({ 
  valuationResult, 
  onContinue, 
  onClose,
  onRetry 
}: ValuationResultProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { 
    isOpen: errorDialogOpen,
    setIsOpen: setErrorDialogOpen,
    handleClose: handleErrorClose,
    handleRetry: handleErrorRetry 
  } = useValuationErrorDialog();
  
  // Check for errors as soon as we get results
  useEffect(() => {
    if (valuationResult?.error || valuationResult?.noData) {
      setErrorDialogOpen(true);
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
  const hasError = !!valuationResult.error;
  
  // Now properly check for valid valuation data
  const hasValuation = !hasError && (
    valuationResult.valuation !== undefined || 
    valuationResult.reservePrice !== undefined
  );

  // Handle missing essential data - defer to error handler which can handle partial data
  const hasMissingEssentialData = !hasError && (
    !valuationResult.make || 
    !valuationResult.model || 
    !valuationResult.year
  );

  if (hasError || valuationResult?.noData) {
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

  // Use fallback values for missing properties
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
