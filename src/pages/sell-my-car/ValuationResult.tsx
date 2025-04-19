
import React from 'react';
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ValuationContent } from "@/components/hero/valuation/components/ValuationContent";
import { useValuationContinue } from "@/components/hero/valuation/hooks/useValuationContinue";
import { LoadingIndicator } from "@/components/common/LoadingIndicator";
import { ValuationErrorDialog } from "@/components/hero/valuation/components/dialogs/ValuationErrorDialog";
import { useValuationErrorDialog } from "@/hooks/valuation/useValuationErrorDialog";
import { 
  NoValuationDataError, 
  InvalidValuationDataError,
  ValuationError 
} from "@/errors/valuation/valuationErrors";

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
  const [isValidatingData, setIsValidatingData] = useState(true);
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
      noData: valuationResult?.noData
    });
  }, [valuationResult]);

  const navigate = useNavigate();
  const { handleContinue, isLoggedIn } = useValuationContinue();

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

  const mileage = parseInt(localStorage.getItem('tempMileage') || '0', 10);
  
  if (valuationResult.error || valuationResult?.noData) {
    let error;
    if (valuationResult.noData) {
      error = new NoValuationDataError(valuationResult.vin || '');
    } else if (!valuationResult.make || !valuationResult.model || !valuationResult.year) {
      error = new InvalidValuationDataError(
        valuationResult.vin || '', 
        valuationResult
      );
    } else {
      error = new ValuationError({
        message: valuationResult.error || "An unexpected error occurred",
        retry: true
      });
    }

    console.error('Valuation error:', {
      type: error.constructor.name,
      message: error.message,
      details: valuationResult
    });

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
        error={error.message}
        description={error instanceof ValuationError ? error.description : undefined}
      />
    );
  }

  const normalizedResult = {
    make: valuationResult.make || 'Unknown Make',
    model: valuationResult.model || 'Unknown Model',
    year: valuationResult.year || new Date().getFullYear(),
    vin: valuationResult.vin || '',
    transmission: valuationResult.transmission === 'automatic' ? 'automatic' : 'manual',
    reservePrice: valuationResult.reservePrice || valuationResult.valuation || 0,
    averagePrice: valuationResult.averagePrice || valuationResult.valuation || 0
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
      transmission={normalizedResult.transmission as 'manual' | 'automatic'}
      mileage={mileage}
      reservePrice={normalizedResult.reservePrice}
      averagePrice={normalizedResult.averagePrice}
      hasValuation={true}
      isLoggedIn={isLoggedIn}
      onClose={onClose}
      onContinue={() => handleContinue(valuationResult)}
    />
  );
};
