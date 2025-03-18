
/**
 * Changes made:
 * - 2024-10-30: Updated to import formatCurrency from validation utils
 * - 2024-10-30: Fixed formatting and component structure
 */

import { Button } from "@/components/ui/button";
import { VehicleDetails } from "./VehicleDetails";
import { ValuationDisplay } from "./ValuationDisplay";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { formatCurrency } from "@/utils/validation";
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ValuationContentProps {
  make: string;
  model: string;
  year: number;
  vin: string;
  transmission: string;
  mileage: number;
  reservePrice?: number | null;
  averagePrice?: number | null;
  hasValuation: boolean;
  isLoggedIn: boolean;
  onClose: () => void;
  onContinue: () => void;
}

export const ValuationContent = ({ 
  make, 
  model, 
  year, 
  vin, 
  transmission,
  mileage,
  reservePrice,
  averagePrice,
  hasValuation,
  isLoggedIn,
  onClose,
  onContinue
}: ValuationContentProps) => {
  return (
    <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-center text-2xl mb-2">
          Vehicle Valuation Results
        </DialogTitle>
      </DialogHeader>
      
      <div className="space-y-4 py-2">
        <VehicleDetails
          make={make}
          model={model}
          year={year}
          transmission={transmission}
          mileage={mileage}
          vin={vin}
        />
        
        {hasValuation && (
          <ValuationMainContent 
            averagePrice={averagePrice}
            reservePrice={reservePrice}
          />
        )}
      </div>
      
      <CardFooter className="flex flex-col sm:flex-row gap-2 justify-end mt-4 sm:mt-0">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          className="bg-primary hover:bg-primary/90 text-white" 
          onClick={onContinue}
        >
          {isLoggedIn ? 'Continue to Listing' : 'Sign In to Continue'}
        </Button>
      </CardFooter>
    </DialogContent>
  );
};

// Extract ValuationMainContent as a separate component for clarity
const ValuationMainContent = ({ 
  averagePrice, 
  reservePrice 
}: { 
  averagePrice?: number | null;
  reservePrice?: number | null;
}) => {
  const displayPrice = averagePrice || reservePrice || 0;
  
  return (
    <Card className="border border-gray-200">
      <CardContent className="pt-6">
        <h3 className="text-xl font-semibold mb-4 text-center">
          Estimated Value
        </h3>
        
        <ValuationDisplay amount={displayPrice} />
        
        <div className="mt-6 text-center">
          <p className="text-subtitle text-sm">
            Valuation based on market trends and vehicle condition
          </p>
        </div>
        
        {reservePrice && reservePrice !== displayPrice && (
          <div className="mt-4 p-3 bg-iris-light rounded-md">
            <h4 className="font-medium mb-1">Reserve Price</h4>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(reservePrice)}
            </p>
            <p className="text-xs text-subtitle mt-1">
              This is the minimum price your vehicle must reach to be sold at auction
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
