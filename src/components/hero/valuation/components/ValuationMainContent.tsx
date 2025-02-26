
/**
 * Changes made:
 * - 2024-03-19: Created ValuationMainContent component extracted from ValuationResult
 * - 2024-03-19: Updated props to only pass reservePrice to ValuationDisplay
 */

import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { VehicleDetails } from "./VehicleDetails";
import { ValuationDisplay } from "./ValuationDisplay";

interface ValuationMainContentProps {
  make: string;
  model: string;
  year: number;
  vin: string;
  transmission: string;
  mileage: number;
  averagePrice?: number;
  valuation?: number;
  reservePrice?: number;
  hasValuation: boolean;
  isLoggedIn: boolean;
  onClose: () => void;
  onContinue: () => void;
}

export const ValuationMainContent = ({
  make,
  model,
  year,
  vin,
  transmission,
  mileage,
  reservePrice = 0,
  hasValuation,
  isLoggedIn,
  onClose,
  onContinue,
}: ValuationMainContentProps) => {
  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold text-center mb-6">
          Your Vehicle Valuation
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-6">
        <VehicleDetails 
          make={make}
          model={model}
          year={year}
          vin={vin}
          transmission={transmission}
          mileage={mileage}
        />

        {hasValuation && (
          <ValuationDisplay reservePrice={reservePrice} />
        )}
      </div>

      <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6">
        <Button 
          variant="outline"
          onClick={onClose}
          className="w-full sm:w-auto"
        >
          Close
        </Button>
        <Button 
          onClick={onContinue}
          className="w-full sm:w-auto bg-secondary hover:bg-secondary/90 text-white"
        >
          {!isLoggedIn 
            ? "Sign Up to List Your Car" 
            : "List This Car"
          }
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};
