
/**
 * Changes made:
 * - 2024-03-19: Initial implementation
 * - 2024-03-19: Added user authentication checks
 * - 2027-07-27: Added isLoading prop and passed it to ContinueButton
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
import { ContinueButton } from "./buttons/ContinueButton";

interface ValuationContentProps {
  make: string;
  model: string;
  year: number;
  vin: string;
  transmission: string;
  mileage: number;
  averagePrice?: number;
  reservePrice?: number;
  hasValuation: boolean;
  isLoggedIn: boolean;
  isLoading?: boolean;
  error?: string;
  onClose: () => void;
  onContinue: () => void;
  onRetry?: () => void;
}

export const ValuationContent = ({
  make,
  model,
  year,
  vin,
  transmission,
  mileage,
  reservePrice = 0,
  hasValuation,
  isLoggedIn,
  isLoading = false,
  error,
  onClose,
  onContinue,
  onRetry
}: ValuationContentProps) => {
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
        
        {error && (
          <div className="text-red-500 p-3 bg-red-50 rounded-md">
            {error}
            {onRetry && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRetry}
                className="mt-2 w-full"
              >
                Retry
              </Button>
            )}
          </div>
        )}
      </div>

      <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6">
        <Button 
          variant="outline"
          onClick={onClose}
          className="w-full sm:w-auto"
          disabled={isLoading}
        >
          Close
        </Button>
        <ContinueButton 
          isLoggedIn={isLoggedIn}
          onClick={onContinue}
          isLoading={isLoading}
        />
      </DialogFooter>
    </DialogContent>
  );
};
