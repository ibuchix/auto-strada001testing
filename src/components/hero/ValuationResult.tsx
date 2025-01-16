import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface ValuationResultProps {
  valuationResult: {
    make: string;
    model: string;
    year: number;
    vin: string;
    transmission: string;
    valuation?: number;
    averagePrice?: number;
    minimumPrice?: number;
    maximumPrice?: number;
    isExisting?: boolean;
  };
  onContinue: () => void;
  onClose: () => void;
}

export const ValuationResult = ({ valuationResult, onContinue, onClose }: ValuationResultProps) => {
  if (!valuationResult) return null;

  const mileage = parseInt(localStorage.getItem('tempMileage') || '0');

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
            <p className="font-medium text-dark">{valuationResult.make}</p>
          </div>
          <div className="bg-accent/50 p-4 rounded-lg">
            <p className="text-sm text-subtitle mb-1">Model</p>
            <p className="font-medium text-dark">{valuationResult.model}</p>
          </div>
          <div className="bg-accent/50 p-4 rounded-lg">
            <p className="text-sm text-subtitle mb-1">Year</p>
            <p className="font-medium text-dark">{valuationResult.year}</p>
          </div>
          <div className="bg-accent/50 p-4 rounded-lg">
            <p className="text-sm text-subtitle mb-1">VIN</p>
            <p className="font-medium text-dark">{valuationResult.vin}</p>
          </div>
          <div className="bg-accent/50 p-4 rounded-lg">
            <p className="text-sm text-subtitle mb-1">Transmission</p>
            <p className="font-medium text-dark capitalize">{valuationResult.transmission}</p>
          </div>
          <div className="bg-accent/50 p-4 rounded-lg">
            <p className="text-sm text-subtitle mb-1">Mileage</p>
            <p className="font-medium text-dark">{mileage.toLocaleString()} km</p>
          </div>
        </div>
        <div className="border-t pt-6 space-y-4">
          <div>
            <p className="text-sm text-subtitle mb-2">
              {valuationResult.isExisting 
                ? "Estimated Value (Based on Similar Vehicle)" 
                : "Estimated Market Value"
              }
            </p>
            <p className="text-3xl font-bold text-primary">
              PLN {(valuationResult.averagePrice || valuationResult.valuation || 0).toLocaleString()}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-subtitle mb-1">Minimum Price</p>
              <p className="font-medium text-dark">
                PLN {(valuationResult.minimumPrice || 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-subtitle mb-1">Maximum Price</p>
              <p className="font-medium text-dark">
                PLN {(valuationResult.maximumPrice || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
      <DialogFooter className="flex flex-col sm:flex-row gap-3">
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