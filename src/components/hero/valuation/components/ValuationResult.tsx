
/**
 * Changes made:
 * - 2024-09-28: Updated to work with modified useValuationContinue hook
 */

import { useAuth } from "@/components/AuthProvider";
import { useNavigate } from "react-router-dom";
import { ErrorDialog } from "./ErrorDialog";
import { ExistingVehicleDialog } from "./ExistingVehicleDialog";
import { ValuationContent } from "./ValuationContent";
import { useValuationContinue } from "../hooks/useValuationContinue";
import { useEffect, useCallback } from "react";

interface ValuationResultProps {
  valuationResult: {
    make: string;
    model: string;
    year: number;
    vin: string;
    transmission: string;
    valuation?: number | null;
    averagePrice?: number | null;
    isExisting?: boolean;
    error?: string;
    rawResponse?: any;
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
  const { session } = useAuth();
  const navigate = useNavigate();
  const { handleContinue, getSafeNavigate } = useValuationContinue();
  
  if (!valuationResult) return null;

  const mileage = parseInt(localStorage.getItem('tempMileage') || '0');
  const hasError = Boolean(valuationResult.error);
  const hasValuation = !hasError && Boolean(valuationResult.averagePrice ?? valuationResult.valuation);
  
  const averagePrice = valuationResult.averagePrice || 0;
  console.log('ValuationResult - Display price:', averagePrice);

  const handleContinueClick = useCallback(async () => {
    // Get the navigation configuration
    const navConfig = await handleContinue(valuationResult);
    
    if (!navConfig) {
      onClose();
      return;
    }
    
    // Create and execute the navigation handler
    const navigateHandler = getSafeNavigate(navConfig);
    navigateHandler();
    
    // Call the onContinue prop
    onContinue();
  }, [valuationResult, handleContinue, getSafeNavigate, onContinue, onClose]);

  if (hasError && valuationResult.isExisting) {
    return <ExistingVehicleDialog onClose={onClose} onRetry={onRetry} />;
  }

  if (hasError) {
    return (
      <ErrorDialog 
        error={valuationResult.error}
        onClose={onClose}
        onRetry={onRetry}
      />
    );
  }

  return (
    <ValuationContent
      make={valuationResult.make}
      model={valuationResult.model}
      year={valuationResult.year}
      vin={valuationResult.vin}
      transmission={valuationResult.transmission}
      mileage={mileage}
      averagePrice={averagePrice}
      hasValuation={hasValuation}
      isLoggedIn={!!session}
      onClose={onClose}
      onContinue={handleContinueClick}
    />
  );
};
