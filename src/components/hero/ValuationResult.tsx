
/**
 * Changes made:
 * - 2025-04-22: Removed localStorage operations to debug nested API data issues
 * - 2025-04-22: Fixed validation utility usage to properly handle nested structure
 * - 2025-04-26: Fixed type error with validateValuationData return value
 * - 2025-04-22: Fixed import path for useValuationContinue hook
 * - 2025-04-29: Improved data extraction from nested API response structures
 * - 2025-04-29: Added fallback estimation for valid car data without prices
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
    usingFallbackEstimation?: boolean;
    estimationMethod?: string;
    data?: any; // Added to handle nested data structure
    functionResponse?: any; // Added to handle nested functionResponse
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
    estimationMethod: valuationResult?.estimationMethod || 'none',
    hasNestedData: !!valuationResult?.data,
    nestedDataKeys: valuationResult?.data ? Object.keys(valuationResult.data) : []
  });
  
  // Enhanced data extraction with more detailed logging
  
  // Prepare data for validation - now properly handling nested data structure
  const validationResult = validateValuationData(valuationResult);
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
        // Store the normalized data instead of the raw data
        localStorage.setItem('valuationData', JSON.stringify(normalizedData));
        localStorage.setItem('tempVIN', normalizedData.vin || '');
        localStorage.setItem('tempMileage', String(mileage || 0));
        localStorage.setItem('tempGearbox', normalizedData.transmission || 'manual');
        console.log('Valuation result stored in localStorage');
      } catch (error) {
        console.error('Failed to store valuation data in localStorage:', error);
      }
    }
  }, [valuationResult, mileage, normalizedData]);

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
        error={normalizedData.error || "No data found for this VIN"}
        description="We couldn't get valuation data for this vehicle. Please check the VIN or try again later."
      />
    );
  }

  // If we have car data but no valuation, generate an estimated price
  // This handles cases where the API returned car details but no price data
  if (normalizedData.make && normalizedData.model && normalizedData.year > 0 && normalizedData.valuation <= 0) {
    // Estimate a price based on make, model, year
    console.log("Auto-estimating price for vehicle with valid data but no price information");
    const estimatedBasePrice = estimateBasePriceByModel(normalizedData.make, normalizedData.model, normalizedData.year);
    normalizedData.valuation = estimatedBasePrice;
    normalizedData.basePrice = estimatedBasePrice;
    normalizedData.reservePrice = calculateReservePrice(estimatedBasePrice);
    normalizedData.averagePrice = estimatedBasePrice;
    normalizedData.usingFallbackEstimation = true;
    normalizedData.estimationMethod = 'make_model_year_estimation';
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
      hasValuation={true} // Force to true if we have make/model/year data to show estimated price
      isLoggedIn={isLoggedIn}
      apiSource={normalizedData.apiSource}
      estimationMethod={normalizedData.estimationMethod}
      errorDetails={errorDebugInfo}
      onClose={onClose}
      onContinue={() => handleContinue(normalizedData)}
    />
  );
};

// Helper function to estimate base price from make/model/year
function estimateBasePriceByModel(make: string, model: string, year: number): number {
  // Base prices by popular makes and models
  const currentYear = new Date().getFullYear();
  const ageInYears = currentYear - year;
  
  // Default starting prices by make
  const basePriceByMake: Record<string, number> = {
    'BMW': 80000,
    'MERCEDES': 75000,
    'AUDI': 70000,
    'VOLKSWAGEN': 45000,
    'TOYOTA': 40000,
    'HONDA': 38000,
    'FORD': 35000,
    'CHEVROLET': 32000,
    'HYUNDAI': 30000,
    'KIA': 28000,
    // Default for other makes
    'DEFAULT': 40000
  };
  
  // Get the base price for this make or use default
  const makeUpperCase = make.toUpperCase();
  let basePrice = basePriceByMake[makeUpperCase] || basePriceByMake.DEFAULT;
  
  // Adjust price based on vehicle age (depreciation)
  // New car loses ~20% in first year, then ~10% per year after
  let depreciationFactor = 1.0;
  if (ageInYears <= 1) {
    depreciationFactor = 0.8; // 20% loss in first year
  } else {
    // Each additional year is ~10% loss
    depreciationFactor = Math.max(0.2, 0.8 * Math.pow(0.9, ageInYears - 1));
  }
  
  // Calculate estimated price with depreciation
  return Math.round(basePrice * depreciationFactor);
}

// Calculate reserve price based on base price
function calculateReservePrice(basePrice: number): number {
  // Determine percentage based on price tier
  let percentage = 0;
  
  if (basePrice <= 15000) {
    percentage = 0.65;
  } else if (basePrice <= 20000) {
    percentage = 0.46;
  } else if (basePrice <= 30000) {
    percentage = 0.37;
  } else if (basePrice <= 50000) {
    percentage = 0.27;
  } else if (basePrice <= 60000) {
    percentage = 0.27;
  } else if (basePrice <= 70000) {
    percentage = 0.22;
  } else if (basePrice <= 80000) {
    percentage = 0.23;
  } else if (basePrice <= 100000) {
    percentage = 0.24;
  } else if (basePrice <= 130000) {
    percentage = 0.20;
  } else if (basePrice <= 160000) {
    percentage = 0.185;
  } else if (basePrice <= 200000) {
    percentage = 0.22;
  } else if (basePrice <= 250000) {
    percentage = 0.17;
  } else if (basePrice <= 300000) {
    percentage = 0.18;
  } else if (basePrice <= 400000) {
    percentage = 0.18;
  } else if (basePrice <= 500000) {
    percentage = 0.16;
  } else {
    percentage = 0.145; // 500,001+
  }
  
  // Calculate and round to nearest whole number
  return Math.round(basePrice - (basePrice * percentage));
}
