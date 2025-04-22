
/**
 * Changes made:
 * - 2025-04-22: Removed localStorage operations to debug nested API data issues
 * - 2025-04-22: Fixed validation utility usage to properly handle nested structure
 */

import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ValuationContent } from "./ValuationContent";
import { useValuationContinue } from "../hooks/useValuationContinue";
import { useState, useEffect } from "react";
import { LoadingIndicator } from "@/components/common/LoadingIndicator";
import { ValuationErrorDialog } from "./dialogs/ValuationErrorDialog";
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
    estimationMethod: valuationResult?.estimationMethod || 'none'
  });
  
  // Prepare data for validation
  const typedValuationResult = valuationResult ? {
    ...valuationResult,
    transmission: (valuationResult.transmission === 'automatic' ? 'automatic' : 'manual') as 'manual' | 'automatic'
  } : null;
  
  // Validate and normalize data
  const validationResult = validateValuationData(typedValuationResult);
  const { normalizedData, hasError, shouldShowError, hasValuation } = validationResult;
  
  // Get mileage from input or localStorage
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
    estimationMethod: normalizedData.estimationMethod || 'none',
    timestamp: new Date().toISOString()
  });

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

  useEffect(() => {
    if (valuationResult) {
      try {
        localStorage.setItem('valuationData', JSON.stringify(valuationResult));
        localStorage.setItem('tempVIN', valuationResult.vin || '');
        localStorage.setItem('tempMileage', String(mileage || 0));
        localStorage.setItem('tempGearbox', valuationResult.transmission || 'manual');
        console.log('Valuation result stored in localStorage');
      } catch (error) {
        console.error('Failed to store valuation data in localStorage:', error);
      }
    }
  }, [valuationResult, mileage]);

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
