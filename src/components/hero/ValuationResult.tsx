import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ValuationResultProps {
  valuationResult: {
    make: string;
    model: string;
    year: number;
    vin: string;
    transmission: string;
    fuelType: string;
    valuation: number;
  } | null;
}

export const ValuationResult = ({ valuationResult }: ValuationResultProps) => {
  if (!valuationResult) return null;

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Your Vehicle Valuation</DialogTitle>
      </DialogHeader>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-subtitle">Manufacturer</p>
            <p className="font-medium">{valuationResult.make}</p>
          </div>
          <div>
            <p className="text-sm text-subtitle">Model</p>
            <p className="font-medium">{valuationResult.model}</p>
          </div>
          <div>
            <p className="text-sm text-subtitle">Year of Production</p>
            <p className="font-medium">{valuationResult.year}</p>
          </div>
          <div>
            <p className="text-sm text-subtitle">VIN</p>
            <p className="font-medium">{valuationResult.vin}</p>
          </div>
          <div>
            <p className="text-sm text-subtitle">Transmission</p>
            <p className="font-medium">{valuationResult.transmission}</p>
          </div>
          <div>
            <p className="text-sm text-subtitle">Fuel Type</p>
            <p className="font-medium">{valuationResult.fuelType}</p>
          </div>
        </div>
        <div className="border-t pt-4">
          <p className="text-sm text-subtitle mb-1">Estimated Market Value</p>
          <p className="text-2xl font-bold text-primary">
            PLN {valuationResult.valuation.toLocaleString()}
          </p>
        </div>
      </div>
    </DialogContent>
  );
};