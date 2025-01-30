import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface VehicleInfoStepProps {
  formData: any;
  onUpdate: (data: any) => void;
}

export const VehicleInfoStep = ({ formData, onUpdate }: VehicleInfoStepProps) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="vin">VIN Number</Label>
        <Input
          id="vin"
          value={formData.vin}
          onChange={(e) => onUpdate({ vin: e.target.value })}
          placeholder="Enter your VIN number"
          className="h-12"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="mileage">Mileage (KM)</Label>
        <Input
          id="mileage"
          type="number"
          value={formData.mileage}
          onChange={(e) => onUpdate({ mileage: e.target.value })}
          placeholder="Enter vehicle mileage"
          className="h-12"
        />
      </div>

      <div className="space-y-2">
        <Label>Transmission</Label>
        <RadioGroup
          value={formData.gearbox}
          onValueChange={(value) => onUpdate({ gearbox: value })}
          className="flex gap-6"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="manual" id="manual" />
            <Label htmlFor="manual">Manual</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="automatic" id="automatic" />
            <Label htmlFor="automatic">Automatic</Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );
};