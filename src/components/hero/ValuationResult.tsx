import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, AlertTriangle } from "lucide-react";

interface ValuationResultProps {
  valuationResult: {
    make: string;
    model: string;
    year: number;
    vin: string;
    transmission: string;
    valuation?: number;
    averagePrice?: number;
    isExisting?: boolean;
    error?: string;
    rawResponse?: any;
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
  if (!valuationResult) return null;

  const mileage = parseInt(localStorage.getItem('tempMileage') || '0');
  const hasError = !!valuationResult.error;
  const hasValuation = !hasError && (valuationResult.averagePrice || valuationResult.valuation);
  
  // Get the average price from the raw response or fall back to the processed average price
  const averagePrice = valuationResult.rawResponse?.functionResponse?.valuation?.calcValuation?.price_avr || 
                      valuationResult.averagePrice || 
                      valuationResult.valuation || 
                      0;

  console.log('Display price:', averagePrice);

  if (hasError) {
    return (
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center mb-6 flex items-center justify-center gap-2">
            <AlertTriangle className="h-6 w-6 text-primary" />
            Valuation Error
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-center text-subtitle">
            {valuationResult.error || "We couldn't get a valuation for your vehicle at this time."}
          </p>
          <p className="text-sm text-center text-subtitle">
            Please try again or enter your details manually.
          </p>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6">
          <Button 
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Close
          </Button>
          {onRetry && (
            <Button 
              onClick={onRetry}
              className="w-full sm:w-auto bg-secondary hover:bg-secondary/90 text-white"
            >
              Try Again
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    );
  }

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold text-center mb-6">
          {valuationResult.isExisting 
            ? "Similar Vehicle Found!" 
            : "Your Vehicle Valuation"
          }
        </DialogTitle>
      </DialogHeader>

      {valuationResult.isExisting && (
        <div className="bg-accent/50 p-4 rounded-lg mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
            <p className="text-sm text-subtitle">
              We found a similar vehicle in our system. Based on this, here's an estimated valuation for your car. Would you like to list yours?
            </p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-accent/50 p-4 rounded-lg">
            <p className="text-sm text-subtitle mb-1">Manufacturer</p>
            <p className="font-medium text-dark">{valuationResult.make || 'N/A'}</p>
          </div>
          <div className="bg-accent/50 p-4 rounded-lg">
            <p className="text-sm text-subtitle mb-1">Model</p>
            <p className="font-medium text-dark">{valuationResult.model || 'N/A'}</p>
          </div>
          <div className="bg-accent/50 p-4 rounded-lg">
            <p className="text-sm text-subtitle mb-1">Year</p>
            <p className="font-medium text-dark">{valuationResult.year || 'N/A'}</p>
          </div>
          <div className="bg-accent/50 p-4 rounded-lg">
            <p className="text-sm text-subtitle mb-1">VIN</p>
            <p className="font-medium text-dark">{valuationResult.vin}</p>
          </div>
          <div className="bg-accent/50 p-4 rounded-lg">
            <p className="text-sm text-subtitle mb-1">Transmission</p>
            <p className="font-medium text-dark capitalize">{valuationResult.transmission || 'N/A'}</p>
          </div>
          <div className="bg-accent/50 p-4 rounded-lg">
            <p className="text-sm text-subtitle mb-1">Mileage</p>
            <p className="font-medium text-dark">{mileage.toLocaleString()} km</p>
          </div>
        </div>

        {hasValuation && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 text-center">
            <p className="text-sm text-subtitle mb-2">Average Market Value</p>
            <p className="text-4xl font-bold text-primary">
              PLN {averagePrice.toLocaleString()}
            </p>
          </div>
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
          {valuationResult.isExisting 
            ? "List My Car" 
            : "List This Car"
          }
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};