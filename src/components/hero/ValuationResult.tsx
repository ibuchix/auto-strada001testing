/**
 * Changes made:
 * - 2025-04-19: Added data validation and improved error handling
 * - 2025-04-19: Enhanced logging for better debugging
 */

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ValuationContent } from "./valuation/components/ValuationContent";
import { useNavigate } from "react-router-dom";
import { useValuationContinue } from "../hooks/useValuationContinue";
import { LoadingIndicator } from "@/components/common/LoadingIndicator";
import { ValuationErrorDialog } from "./valuation/components/dialogs/ValuationErrorDialog";
import { useValuationErrorDialog } from "@/hooks/valuation/useValuationErrorDialog";
import { normalizeTransmission, validateValuationData } from "@/utils/validation/validateTypes";

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
  
  useEffect(() => {
    console.log('ValuationResult mounted with data:', {
      hasData: !!valuationResult,
      error: valuationResult?.error,
      noData: valuationResult?.noData,
      timestamp: new Date().toISOString()
    });
  }, [valuationResult]);

  const navigate = useNavigate();
  const { handleContinue, isLoggedIn } = useValuationContinue();
  const [isValidatingData, setIsValidatingData] = useState(true);
  
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

  if (isValidatingData) {
    return (
      <div className="p-6 text-center">
        <LoadingIndicator message="Processing valuation..." />
      </div>
    );
  }

  const mileage = parseInt(localStorage.getItem('tempMileage') || '0');
  const hasError = !!valuationResult.error;
  
  const hasValuation = !hasError && (
    valuationResult.make && 
    valuationResult.model && 
    valuationResult.year > 0
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

  const isValidData = validateValuationData(valuationResult);
  console.log('Validation status:', { isValidData });

  if (!isValidData && !valuationResult?.error) {
    console.warn('Invalid valuation data structure:', valuationResult);
    return (
      <ValuationErrorDialog
        isOpen={true}
        onClose={onClose}
        onRetry={onRetry}
        error="Invalid valuation data received"
      />
    );
  }

  const normalizedResult = {
    make: valuationResult.make || 'Unknown',
    model: valuationResult.model || 'Vehicle',
    year: valuationResult.year || new Date().getFullYear(),
    vin: valuationResult.vin || '',
    transmission: normalizeTransmission(valuationResult.transmission),
    reservePrice: valuationResult.reservePrice || valuationResult.valuation || 0,
    averagePrice: valuationResult.averagePrice || 0
  };

  console.log('Normalized valuation data:', {
    ...normalizedResult,
    timestamp: new Date().toISOString()
  });

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
      hasValuation={isValidData}
      isLoggedIn={isLoggedIn}
      onClose={onClose}
      onContinue={() => handleContinue(valuationResult)}
    />
  );
};
