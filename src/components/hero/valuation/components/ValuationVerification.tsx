
/**
 * Component for verifying and displaying reserve price accuracy
 * Created: 2025-05-18
 */

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { validateValuationReservePrice } from "@/utils/valuation/reservePriceValidator";
import { calculateReservePrice, formatPrice } from "@/utils/valuation/reservePriceCalculator";
import { Info, CheckCircle, AlertCircle } from "lucide-react";

interface ValuationVerificationProps {
  valuationData: any;
}

export const ValuationVerification: React.FC<ValuationVerificationProps> = ({ valuationData }) => {
  const [showVerification, setShowVerification] = useState(false);
  const [verified, setVerified] = useState<ReturnType<typeof validateValuationReservePrice> | null>(null);
  
  const handleVerify = () => {
    if (!valuationData) return;
    
    const result = validateValuationReservePrice(valuationData);
    setVerified(result);
    setShowVerification(true);
  };
  
  if (!showVerification) {
    return (
      <div className="mt-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleVerify}
          className="flex items-center gap-2 text-xs"
        >
          <Info size={14} />
          Verify Reserve Price Calculation
        </Button>
      </div>
    );
  }
  
  if (!verified) {
    return (
      <Alert variant="destructive" className="mt-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Verification Error</AlertTitle>
        <AlertDescription>
          Insufficient data to verify the reserve price calculation.
        </AlertDescription>
      </Alert>
    );
  }
  
  const { validation, basePrice, reservePrice } = verified;
  const { 
    isValid, 
    expectedReservePrice, 
    discrepancy, 
    discrepancyPercent, 
    priceTier, 
    appliedPercentage 
  } = validation;
  
  return (
    <div className="mt-4 space-y-3">
      <Alert variant={isValid ? "default" : "destructive"} className="relative">
        {isValid ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
        <AlertTitle>
          {isValid ? "Verified Price" : "Price Discrepancy Detected"}
        </AlertTitle>
        <AlertDescription className="text-xs space-y-1">
          <div className="font-medium">Base Price: {formatPrice(basePrice)}</div>
          <div>Price Tier: {priceTier} ({appliedPercentage}% discount)</div>
          <div>Displayed Price: {formatPrice(reservePrice)}</div>
          <div>Expected Price: {formatPrice(expectedReservePrice)}</div>
          {!isValid && (
            <div className="text-red-500">
              Discrepancy: {formatPrice(discrepancy)} ({discrepancyPercent.toFixed(2)}%)
            </div>
          )}
        </AlertDescription>
      </Alert>
      
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => setShowVerification(false)}
        className="text-xs"
      >
        Hide Details
      </Button>
    </div>
  );
};
