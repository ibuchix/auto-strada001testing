
/**
 * One-off component to verify the pricing for the specific Audi A4
 * Created: 2025-05-18
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { validateReservePrice } from "@/utils/valuation/reservePriceValidator";
import { formatPrice } from "@/utils/valuation/reservePriceCalculator";
import { CheckCircle, XCircle } from "lucide-react";

export const AudiA4PriceVerifier = () => {
  const [verification, setVerification] = useState<ReturnType<typeof validateReservePrice> | null>(null);
  
  useEffect(() => {
    // Based on the valuation data from the screenshot and console logs
    const basePrice = 35824; // This is what's in the API response (price_min + price_med)/2
    const displayedReservePrice = 26868; // From the UI
    
    // Validate against our pricing rules
    const result = validateReservePrice(basePrice, displayedReservePrice);
    setVerification(result);
    
    console.log("Reserve Price Verification for VIN: WAUZZZ8K79A090954 (2008 AUDI A4)");
    console.log("Base Price:", basePrice);
    console.log("Expected Reserve Price:", result.expectedReservePrice);
    console.log("Actual Reserve Price:", displayedReservePrice);
    console.log("Is Valid:", result.isValid ? "Yes" : "No");
  }, []);
  
  if (!verification) {
    return <div>Analyzing pricing...</div>;
  }
  
  const { 
    isValid, 
    expectedReservePrice, 
    discrepancy, 
    discrepancyPercent, 
    priceTier, 
    appliedPercentage 
  } = verification;
  
  const basePrice = 35824;
  const displayedReservePrice = 26868;
  
  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Price Verification Result
          {isValid ? 
            <CheckCircle className="text-green-500 h-5 w-5" /> : 
            <XCircle className="text-red-500 h-5 w-5" />
          }
        </CardTitle>
        <CardDescription>2008 AUDI A4 (VIN: WAUZZZ8K79A090954)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="text-gray-500">Base Price:</div>
          <div className="font-medium">{formatPrice(basePrice)}</div>
          
          <div className="text-gray-500">Price Tier:</div>
          <div className="font-medium">{priceTier}</div>
          
          <div className="text-gray-500">Applied Discount:</div>
          <div className="font-medium">{appliedPercentage}%</div>
          
          <div className="text-gray-500">Expected Reserve Price:</div>
          <div className="font-medium">{formatPrice(expectedReservePrice)}</div>
          
          <div className="text-gray-500">Displayed Reserve Price:</div>
          <div className="font-medium">{formatPrice(displayedReservePrice)}</div>
          
          {!isValid && (
            <>
              <div className="text-gray-500">Discrepancy:</div>
              <div className="font-medium text-red-500">
                {formatPrice(discrepancy)} ({discrepancyPercent.toFixed(2)}%)
              </div>
            </>
          )}
        </div>
        
        <div className={`p-3 rounded-md text-center ${isValid ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {isValid ? 
            "The reserve price is correctly calculated" : 
            "The reserve price does not match our calculation formula"
          }
        </div>
      </CardContent>
    </Card>
  );
};
