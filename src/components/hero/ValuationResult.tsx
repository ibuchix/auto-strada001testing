
/**
 * Changes made:
 * - 2025-05-02: Removed fallback estimation logic as requested
 * - 2025-05-02: Improved error handling for incomplete valuation data
 * - 2025-05-02: Using centralized data extraction utilities
 * - 2025-05-02: Cleaner validation flow with stricter requirements
 */

import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ValuationContent } from "./valuation/components/ValuationContent";
import { useValuationContinue } from "@/hooks/valuation/useValuationContinue";
import { useState, useEffect } from "react";
import { LoadingIndicator } from "@/components/common/LoadingIndicator";
import { ValuationErrorDialog } from "./valuation/components/dialogs/ValuationErrorDialog";
import { useValuationErrorDialog } from "@/hooks/valuation/useValuationErrorDialog";
import { normalizeTransmission, validateValuationData } from "@/utils/validation/validateTypes";
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
  
  useValuationLogger({
    data: valuationResult,
    stage: 'ValuationResult-Initial',
    enabled: true,
    inspectNested: true
  });
  
  console.log("Raw valuation result in ValuationResult:", {
    result: valuationResult,
    hasData: !!valuationResult,
    makePresent: valuationResult?.make ? "yes" : "no",
    modelPresent: valuationResult?.model ? "yes" : "no",
    yearPresent: valuationResult?.year ? "yes" : "no",
    reservePricePresent: valuationResult?.reservePrice ? "yes" : "no",
    valuationPresent: valuationResult?.valuation ? "yes" : "no",
    apiSource: valuationResult?.apiSource || 'unknown',
    errorDetails: valuationResult?.errorDetails || 'none',
    hasNestedData: !!valuationResult?.data,
    nestedDataKeys: valuationResult?.data ? Object.keys(valuationResult.data) : [],
    hasFunctionResponse: !!valuationResult?.functionResponse
  });
  
  // Validate the data with stricter rules - NO FALLBACKS
  const validationResult = validateValuationData(valuationResult);
  const { normalizedData, hasError, shouldShowError, hasValuation } = validationResult;
  
  // Get mileage from localStorage
  const mileage = parseInt(localStorage.getItem('tempMileage') || '0');

  console.log("Normalized valuation data:", {
    data: normalizedData,
    hasError,
    shouldShowError,
    hasValuation,
    make: normalizedData.make,
    model: normalizedData.model,
    year: normalizedData.year,
    reservePrice: normalizedData.reservePrice,
    valuation: normalizedData.valuation,
    apiSource: normalizedData.apiSource || 'unknown',
    timestamp: new Date().toISOString()
  });

  // Show error dialog if validation fails
  useEffect(() => {
    if (shouldShowError) {
      setErrorDialogOpen(true);
    }
  }, [shouldShowError, setErrorDialogOpen]);

  // Short delay to prevent flashing
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsValidatingData(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Store valid valuation data when available
  useEffect(() => {
    if (valuationResult && hasValuation) {
      try {
        localStorage.setItem('valuationData', JSON.stringify(normalizedData));
        localStorage.setItem('tempVIN', normalizedData.vin || '');
        localStorage.setItem('tempMileage', String(mileage || 0));
        localStorage.setItem('tempGearbox', normalizedData.transmission || 'manual');
        console.log('Valuation result stored in localStorage');
      } catch (error) {
        console.error('Failed to store valuation data in localStorage:', error);
      }
    }
  }, [valuationResult, mileage, normalizedData, hasValuation]);

  // Show loading indicator while validating
  if (!valuationResult || isValidatingData) {
    return (
      <div className="p-6 text-center">
        <LoadingIndicator message="Processing valuation..." />
      </div>
    );
  }

  // Show error dialog if validation failed
  if (shouldShowError) {
    // Determine appropriate error message
    let errorMessage = normalizedData.error || "Couldn't retrieve complete valuation data";
    
    if (!normalizedData.make || !normalizedData.model || !normalizedData.year) {
      errorMessage = "Vehicle information could not be retrieved for this VIN";
    } else if (normalizedData.reservePrice <= 0) {
      errorMessage = "Pricing data could not be retrieved for this vehicle";
    } else if (normalizedData.noData) {
      errorMessage = "No data found for this VIN";
    }
    
    return (
      <ValuationErrorDialog
        isOpen={errorDialogOpen}
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
          navigate('/manual-valuation');
        }}
        error={errorMessage}
        description="To continue, you can try again with a different VIN or proceed with manual listing."
      />
    );
  }

  // Only show valuation content if we have valid data
  return (
    <ValuationContent
      make={normalizedData.make}
      model={normalizedData.model}
      year={normalizedData.year}
      vin={normalizedData.vin}
      transmission={normalizedData.transmission}
      mileage={mileage}
      reservePrice={normalizedData.reservePrice}
      averagePrice={normalizedData.averagePrice || 0}
      hasValuation={hasValuation}
      isLoggedIn={isLoggedIn}
      apiSource={normalizedData.apiSource}
      onClose={onClose}
      onContinue={() => handleContinue(normalizedData)}
    />
  );
};
