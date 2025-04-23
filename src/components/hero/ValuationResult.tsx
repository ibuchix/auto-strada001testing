
/**
 * Changes made:
 * - 2025-05-03: Removed all fallback price estimation mechanisms
 * - 2025-05-03: Enhanced error handling with clear distinction between VIN errors and price errors
 * - 2025-05-03: Improved logging for better debugging of data extraction issues
 * - 2025-05-03: Added explicit checking for missing price data
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
  
  // Enhanced logging of the valuation result
  useValuationLogger({
    data: valuationResult,
    stage: 'ValuationResult-Initial',
    enabled: true,
    inspectNested: true
  });
  
  console.log("Raw valuation result in ValuationResult:", {
    hasData: !!valuationResult,
    makePresent: valuationResult?.make ? "yes" : "no",
    modelPresent: valuationResult?.model ? "yes" : "no",
    yearPresent: valuationResult?.year ? "yes" : "no",
    reservePricePresent: valuationResult?.reservePrice ? "yes" : "no",
    valuationPresent: valuationResult?.valuation ? "yes" : "no",
    apiSource: valuationResult?.apiSource || 'unknown',
    errorDetails: valuationResult?.errorDetails || 'none',
    hasNestedData: !!valuationResult?.data,
    hasFunctionResponse: !!valuationResult?.functionResponse,
    timestamp: new Date().toISOString()
  });
  
  // Validate the data with stricter rules - NO FALLBACKS
  const validationResult = validateValuationData(valuationResult);
  const { normalizedData, hasError, shouldShowError, hasValuation } = validationResult;
  
  // Get mileage from localStorage
  const mileage = parseInt(localStorage.getItem('tempMileage') || '0');

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
    // Determine if the error is related to VIN not found or price data missing
    const isVinError = normalizedData.noData || (normalizedData.error && normalizedData.error.toLowerCase().includes('vin'));
    let errorMessage: string;
    let errorDescription: string;
    
    if (isVinError) {
      // This is a case where the VIN was not found in the database
      errorMessage = "Vehicle not found";
      errorDescription = "This VIN couldn't be found in our database. You may proceed with manual listing.";
    } else if (!normalizedData.make || !normalizedData.model || !normalizedData.year) {
      // Missing vehicle details
      errorMessage = "Vehicle information incomplete";
      errorDescription = "We couldn't retrieve complete information for this vehicle. Please check the VIN and try again.";
    } else if (normalizedData.reservePrice <= 0) {
      // This is a case where we have vehicle data but no pricing data
      errorMessage = "Price information unavailable";
      errorDescription = "We found your vehicle but couldn't retrieve pricing information. Please try again or contact support.";
    } else {
      // Generic error
      errorMessage = normalizedData.error || "Valuation error";
      errorDescription = "An error occurred during the valuation process. Please try again.";
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
          // Only offer manual valuation if VIN not found
          if (isVinError) {
            navigate('/manual-valuation');
          } else {
            // For price errors, we should retry instead
            if (onRetry) onRetry();
            else onClose();
          }
        }}
        error={errorMessage}
        description={errorDescription}
        showManualOption={isVinError} // Only show manual option for VIN errors
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
      errorDetails={normalizedData.errorDetails}
      onClose={onClose}
      onContinue={() => handleContinue(normalizedData)}
    />
  );
};
