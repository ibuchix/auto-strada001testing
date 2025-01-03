import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ValuationResultProps {
  valuationResult: {
    make: string;
    model: string;
    year: number;
    vin: string;
    transmission: string;
    fuel_type: string;
    valuation: number;
    mileage: number;
  } | null;
}

export const ValuationResult = ({ valuationResult }: ValuationResultProps) => {
  const navigate = useNavigate();

  if (!valuationResult) return null;

  const handleListCar = () => {
    navigate('/sell-my-car');
  };

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
            <p className="text-sm text-subtitle mb-1">Fuel Type</p>
            <p className="font-medium text-dark">{valuationResult.fuel_type}</p>
          </div>
          <div className="bg-accent/50 p-4 rounded-lg">
            <p className="text-sm text-subtitle mb-1">Mileage</p>
            <p className="font-medium text-dark">{valuationResult.mileage.toLocaleString()} km</p>
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
          onClick={handleListCar}
          className="w-full bg-secondary hover:bg-secondary/90 text-white"
        >
          List This Car
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};