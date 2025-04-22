/**
 * Changes made:
 * - 2025-04-22: Removed localStorage operations to debug nested API data issues
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
    usingFallbackEstimation?: boolean;
    estimationMethod?: string;
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
    errorDetails: valuationResult?.errorDetails || 'none',
    estimationMethod: valuationResult?.estimationMethod || 'none'
  });
  
  // Convert the string transmission to the expected union type
  const typedValuationResult = valuationResult ? {
    ...valuationResult,
    transmission: (valuationResult.transmission === 'automatic' ? 'automatic' : 'manual') as 'manual' | 'automatic'
  } : null;
  
  // Use our enhanced hook to validate and normalize data
  const { normalizedData, hasError, shouldShowError, hasValuation } = useValuationData(typedValuationResult);
  const mileage = 0; // Default value instead of reading from localStorage

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
    estimationMethod: normalizedData.estimationMethod || 'none',
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
  const errorDebugInfo = normalizedData.usingFallbackEstimation ? 
    `Using estimated value (${normalizedData.estimationMethod === 'make_model_year' ? 
      'based on make/model/year' : 'default value'})` : 
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
      estimationMethod={normalizedData.estimationMethod}
      errorDetails={errorDebugInfo}
      onClose={onClose}
      onContinue={() => handleContinue(normalizedData)}
    />
  );
};
