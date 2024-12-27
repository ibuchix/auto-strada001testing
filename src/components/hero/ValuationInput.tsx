import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

interface ValuationInputProps {
  vin: string;
  mileage: string;
  isLoading: boolean;
  onVinChange: (value: string) => void;
  onMileageChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const ValuationInput = ({ 
  vin, 
  mileage,
  isLoading, 
  onVinChange,
  onMileageChange, 
  onSubmit 
}: ValuationInputProps) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-sm mx-auto">
      <div className="space-y-3">
        <Input
          type="text"
          placeholder="ENTER VIN"
          value={vin}
          onChange={(e) => onVinChange(e.target.value)}
          className="h-12 text-center text-lg border-2 border-secondary/20 bg-white placeholder:text-secondary/70 rounded-md"
          disabled={isLoading}
        />
        <Input
          type="number"
          placeholder="ENTER MILEAGE (KM)"
          value={mileage}
          onChange={(e) => onMileageChange(e.target.value)}
          className="h-12 text-center text-lg border-2 border-secondary/20 bg-white placeholder:text-secondary/70 rounded-md"
          disabled={isLoading}
          min="0"
        />
      </div>
      <Button 
        type="submit" 
        className="w-full h-12 bg-secondary hover:bg-secondary/90 text-white text-lg rounded-md flex items-center justify-center gap-2"
        disabled={isLoading}
      >
        {isLoading ? "GETTING VALUATION..." : "VALUE YOUR CAR"}
        <ChevronRight className="w-5 h-5" />
      </Button>
    </form>
  );
};