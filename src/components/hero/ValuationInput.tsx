import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronRight, Edit2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface ValuationInputProps {
  vin: string;
  mileage: string;
  gearbox: string;
  isLoading: boolean;
  onVinChange: (value: string) => void;
  onMileageChange: (value: string) => void;
  onGearboxChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onManualEntry: () => void;
}

export const ValuationInput = ({ 
  vin, 
  mileage,
  gearbox,
  isLoading, 
  onVinChange,
  onMileageChange,
  onGearboxChange,
  onSubmit,
  onManualEntry
}: ValuationInputProps) => {
  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-sm mx-auto">
      <div className="space-y-4">
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
        <div className="bg-white border-2 border-secondary/20 rounded-md p-4">
          <RadioGroup
            value={gearbox}
            onValueChange={onGearboxChange}
            className="flex gap-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="manual" id="manual" />
              <Label htmlFor="manual" className="font-medium cursor-pointer">Manual</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="automatic" id="automatic" />
              <Label htmlFor="automatic" className="font-medium cursor-pointer">Automatic</Label>
            </div>
          </RadioGroup>
        </div>
      </div>
      <div className="space-y-3">
        <Button 
          type="submit" 
          className="w-full h-12 bg-secondary hover:bg-secondary/90 text-white text-lg rounded-md flex items-center justify-center gap-2"
          disabled={isLoading}
        >
          {isLoading ? "GETTING VALUATION..." : "VALUE YOUR CAR"}
          <ChevronRight className="w-5 h-5" />
        </Button>
        
        <Button 
          type="button"
          variant="outline"
          onClick={(e) => {
            e.preventDefault();
            onManualEntry();
          }}
          className="w-full h-12 text-lg border-2 border-secondary/20"
        >
          <Edit2 className="mr-2 h-5 w-5" />
          Enter Details Manually
        </Button>
      </div>
    </form>
  );
};