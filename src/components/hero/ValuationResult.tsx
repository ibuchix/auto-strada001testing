import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { ErrorDialog } from "./valuation/components/ErrorDialog";
import { VehicleDetails } from "./valuation/components/VehicleDetails";
import { ValuationDisplay } from "./valuation/components/ValuationDisplay";

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
  
  // Get the average price directly from the valuation result
  const averagePrice = typeof valuationResult.averagePrice === 'number' 
    ? valuationResult.averagePrice 
    : 0;
    
  console.log('Display price:', averagePrice);

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
        <VehicleDetails 
          make={valuationResult.make}
          model={valuationResult.model}
          year={valuationResult.year}
          vin={valuationResult.vin}
          transmission={valuationResult.transmission}
          mileage={mileage}
        />

        {hasValuation && (
          <ValuationDisplay averagePrice={averagePrice} />
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