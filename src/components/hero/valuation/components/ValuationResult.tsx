
/**
 * ValuationResult Component
 * Updated: 2025-04-17
 * - Simplified component structure
 * - Improved error handling
 * - Enhanced data normalization
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
  const [isValidatingData, setIsValidatingData] = useState(true);
  const { isOpen: internalErrorDialogOpen, setIsOpen: internalSetErrorDialogOpen } = useValuationErrorDialog();
  const navigate = useNavigate();
  const { handleContinue, isLoggedIn } = useValuationContinue();
  
  const errorDialogOpen = externalErrorDialogOpen !== undefined ? externalErrorDialogOpen : internalErrorDialogOpen;
  const setErrorDialogOpen = externalSetErrorDialogOpen || internalSetErrorDialogOpen;

  const { normalizedData, hasError, shouldShowError, hasValuation } = useValuationData(valuationResult);
  const mileage = parseInt(localStorage.getItem('tempMileage') || '0');

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
