
/**
 * Changes made:
 * - 2025-04-22: Enhanced data validation and processing
 * - 2025-04-22: Added better debugging and improved data handling
 * - 2025-04-22: Fixed price data extraction and display
 * - 2025-04-18: Fixed hasValuation logic to handle cases where price data is missing
 * - 2025-04-23: Fixed TypeScript casting for transmission property
 * - 2025-04-23: Added API source and error details for better debugging
 * - 2025-04-24: Fixed TypeScript errors by ensuring proper type definitions
 */

import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ValuationContent } from "./ValuationContent";
import { useValuationContinue } from "../hooks/useValuationContinue";
import { useState, useEffect } from "react";
import { LoadingIndicator } from "@/components/common/LoadingIndicator";
import { ValuationErrorDialog } from "./dialogs/ValuationErrorDialog";
import { useValuationErrorDialog } from "@/hooks/valuation/useValuationErrorDialog";
import { useValuationData } from "@/hooks/valuation/useValuationData";
import { ValuationData } from "@/hooks/valuation/types/valuationTypes";
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
  
  // Enhanced logging to debug the valuation process
  useValuationLogger({
    data: valuationResult,
    stage: 'ValuationResult-Initial',
    enabled: true,
    inspectNested: true
  });
  
  // Log the raw valuation result for debugging
  console.log("Raw valuation result in ValuationResult:", {
    result: valuationResult,
    hasData: !!valuationResult,
    makePresent: valuationResult?.make ? "yes" : "no",
    modelPresent: valuationResult?.model ? "yes" : "no",
    yearPresent: valuationResult?.year ? "yes" : "no",
    reservePricePresent: valuationResult?.reservePrice ? "yes" : "no",
    valuationPresent: valuationResult?.valuation ? "yes" : "no",
    apiSource: valuationResult?.apiSource || 'unknown',
    errorDetails: valuationResult?.errorDetails || 'none'
  });
  
  // Convert the string transmission to the expected union type
  const typedValuationResult = valuationResult ? {
    ...valuationResult,
    transmission: (valuationResult.transmission === 'automatic' ? 'automatic' : 'manual') as 'manual' | 'automatic'
  } : null;
  
  // Use our enhanced hook to validate and normalize data
  const { normalizedData, hasError, shouldShowError, hasValuation } = useValuationData(typedValuationResult);
  const mileage = parseInt(localStorage.getItem('tempMileage') || '0');

  // Log normalized data for debugging
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

  // Effect to show error dialog when error is detected
  useEffect(() => {
    if (shouldShowError) {
      setErrorDialogOpen(true);
    }
  }, [shouldShowError, setErrorDialogOpen]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsValidatingData(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  if (!valuationResult || isValidatingData) {
    return (
      <div className="p-6 text-center">
        <LoadingIndicator message="Processing valuation..." />
      </div>
    );
  }

  if (shouldShowError) {
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
        error={valuationResult.error || "No data found for this VIN"}
      />
    );
  }

  // Generate error details for debugging if we're using estimated values
  const errorDebugInfo = normalizedData.apiSource === 'estimation' || normalizedData.usingFallbackEstimation ? 
    `Using estimated value (API price data missing or invalid)` : 
    normalizedData.errorDetails || undefined;

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
      errorDetails={errorDebugInfo}
      onClose={onClose}
      onContinue={() => handleContinue(normalizedData)}
    />
  );
};
