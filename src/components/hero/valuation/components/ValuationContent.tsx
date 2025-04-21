
/**
 * Component to display car valuation results
 * Updated 2025-04-22: Fixed missing Description for DialogContent warning
 * Updated 2025-04-23: Added error details debug prop for better valuation troubleshooting
 * Updated 2025-04-24: Updated interface to include apiSource, ensuring TypeScript compatibility
 * Updated 2025-04-25: Added estimation method information for better price display
 */

import { X } from "lucide-react";
import { ValuationPriceDisplay } from "./ValuationPriceDisplay";
import { DialogContent, DialogHeader, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/utils/formatters";

interface ValuationContentProps {
  make?: string;
  model?: string;
  year?: number;
  vin?: string;
  transmission?: 'manual' | 'automatic';
  mileage?: number;
  reservePrice?: number;
  averagePrice?: number;
  hasValuation?: boolean;
  isLoggedIn?: boolean;
  apiSource?: string;
  estimationMethod?: string;
  errorDetails?: string;
  onClose: () => void;
  onContinue: () => void;
}

export const ValuationContent = ({
  make = '',
  model = '',
  year = 0,
  vin = '',
  transmission = 'manual',
  mileage = 0,
  reservePrice = 0,
  averagePrice = 0,
  hasValuation = false,
  isLoggedIn = false,
  apiSource = 'default',
  estimationMethod,
  errorDetails,
  onClose,
  onContinue
}: ValuationContentProps) => {
  // Log the props we received
  console.log('ValuationContent rendering with:', {
    make,
    model,
    year,
    vin,
    mileage,
    transmission,
    reservePrice,
    averagePrice,
    hasValidReservePrice: typeof reservePrice === 'number' && reservePrice > 0,
    hasValidAveragePrice: typeof averagePrice === 'number' && averagePrice > 0,
    hasValuation,
    apiSource,
    estimationMethod,
    errorDetails,
    timestamp: new Date().toISOString()
  });

  return (
    <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
      <DialogHeader className="flex flex-row items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-800">
          Vehicle Valuation
        </h2>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6">
          <X className="h-4 w-4" />
        </Button>
      </DialogHeader>
      
      <DialogDescription>
        Review your vehicle valuation details and continue to list your car.
      </DialogDescription>

      <div className="grid gap-4 py-2">
        <div className="flex flex-col space-y-1.5">
          <h3 className="text-lg font-semibold">
            {make} {model} <span className="text-muted-foreground">{year}</span>
          </h3>
          <p className="text-sm text-muted-foreground">
            {formatNumber(mileage)} km • {transmission === 'automatic' ? 'Automatic' : 'Manual'} • VIN: {vin || 'N/A'}
          </p>
        </div>

        <ValuationPriceDisplay
          reservePrice={reservePrice}
          averagePrice={averagePrice}
          showAveragePrice={true}
          apiSource={apiSource}
          estimationMethod={estimationMethod}
          errorDetails={errorDetails}
        />

        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <h3 className="text-sm font-medium mb-2">What happens next?</h3>
          <p className="text-sm text-gray-600">
            Continue to list your car for sale. Our certified dealers will place their bids, and you choose the best offer.
          </p>
        </div>
      </div>

      <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
        <Button onClick={onClose} variant="outline" className="w-full sm:w-auto">
          Close
        </Button>
        <Button onClick={onContinue} className="w-full sm:w-auto">
          Continue
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};
