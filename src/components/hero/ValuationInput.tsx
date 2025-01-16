import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronRight, Edit2, AlertCircle } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface ValuationInputProps {
  vin: string;
  mileage: string;
  gearbox: 'manual' | 'automatic';
  isLoading: boolean;
  onVinChange: (value: string) => void;
  onMileageChange: (value: string) => void;
  onGearboxChange: (value: 'manual' | 'automatic') => void;
  onSubmit: (e: React.FormEvent) => void;
  onManualEntry: () => void;
}

const isValidVin = (vin: string) => {
  // Basic VIN validation: 17 alphanumeric characters
  return /^[A-HJ-NPR-Z0-9]{17}$/.test(vin);
};

const isValidMileage = (mileage: string) => {
  const mileageNum = Number(mileage);
  return !isNaN(mileageNum) && mileageNum > 0 && mileageNum < 1000000;
};

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
  const vinError = vin && !isValidVin(vin) ? "Please enter a valid 17-character VIN" : "";
  const mileageError = mileage && !isValidMileage(mileage) ? "Please enter a valid mileage between 0 and 1,000,000 km" : "";
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vinError && !mileageError) {
      onSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-sm mx-auto">
      <div className="space-y-4">
        <div className="space-y-2">
          <Input
            type="text"
            placeholder="ENTER VIN"
            value={vin}
            onChange={(e) => onVinChange(e.target.value.toUpperCase())}
            className={`h-12 text-center text-lg border-2 ${
              vinError ? 'border-primary' : 'border-secondary/20'
            } bg-white placeholder:text-secondary/70 rounded-md`}
            disabled={isLoading}
            maxLength={17}
          />
          {vinError && (
            <div className="flex items-center gap-2 text-primary text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{vinError}</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Input
            type="number"
            placeholder="ENTER MILEAGE (KM)"
            value={mileage}
            onChange={(e) => onMileageChange(e.target.value)}
            className={`h-12 text-center text-lg border-2 ${
              mileageError ? 'border-primary' : 'border-secondary/20'
            } bg-white placeholder:text-secondary/70 rounded-md`}
            disabled={isLoading}
            min="0"
            max="1000000"
          />
          {mileageError && (
            <div className="flex items-center gap-2 text-primary text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{mileageError}</span>
            </div>
          )}
        </div>

        <div className="bg-white border-2 border-secondary/20 rounded-md p-4">
          <RadioGroup
            value={gearbox}
            onValueChange={onGearboxChange}
            className="flex gap-6 justify-center"
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
          disabled={isLoading || !!vinError || !!mileageError}
        >
          {isLoading ? "GETTING VALUATION..." : "VALUE YOUR CAR"}
          <ChevronRight className="w-5 h-5" />
        </Button>
        
        <Button 
          type="button"
          variant="outline"
          onClick={onManualEntry}
          className="w-full h-12 text-lg border-2 border-secondary/20 rounded-md"
          disabled={isLoading}
        >
          <Edit2 className="mr-2 h-5 w-5" />
          Enter Details Manually
        </Button>
      </div>
    </form>
  );
};