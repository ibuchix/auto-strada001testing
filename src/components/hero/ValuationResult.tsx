import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ValuationResultProps {
  valuationResult: {
    make: string;
    model: string;
    year: number;
    vin: string;
    transmission: string;
    valuation: number;
  };
  onContinue: () => void;
}

export const ValuationResult = ({ valuationResult, onContinue }: ValuationResultProps) => {
  if (!valuationResult) return null;

  // Get the stored mileage from localStorage
  const mileage = parseInt(localStorage.getItem('tempMileage') || '0');

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold text-center mb-6">Your Vehicle Valuation</DialogTitle>
      </DialogHeader>
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
        <div className="border-t pt-6">
          <p className="text-sm text-subtitle mb-2">Estimated Market Value</p>
          <p className="text-3xl font-bold text-primary">
            PLN {valuationResult.valuation.toLocaleString()}
          </p>
        </div>
      </div>
      <DialogFooter>
        <Button 
          onClick={onContinue}
          className="w-full bg-secondary hover:bg-secondary/90 text-white"
        >
          List This Car
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};