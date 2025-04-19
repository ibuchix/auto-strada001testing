
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ValuationContent } from "@/components/hero/valuation/components/ValuationContent";
import { useValuationContinue } from "@/components/hero/valuation/hooks/useValuationContinue";
import { LoadingIndicator } from "@/components/common/LoadingIndicator";
import { ValuationErrorDialog } from "@/components/hero/valuation/components/dialogs/ValuationErrorDialog";
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
  
  useEffect(() => {
    if (valuationResult?.error || valuationResult?.noData) {
      setErrorDialogOpen(true);
    }
  }, [valuationResult, setErrorDialogOpen]);

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

  // Type-safe transmission conversion
  const normalizedResult = {
    make: valuationResult.make || 'Unknown',
    model: valuationResult.model || 'Vehicle',
    year: valuationResult.year || new Date().getFullYear(),
    vin: valuationResult.vin || '',
    transmission: (valuationResult.transmission === 'automatic' ? 'automatic' : 'manual') as 'manual' | 'automatic',
    reservePrice: valuationResult.reservePrice || valuationResult.valuation || 0,
    averagePrice: valuationResult.averagePrice || 0
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
