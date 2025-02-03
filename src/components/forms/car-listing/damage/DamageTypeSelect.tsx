import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DamageType } from "../types/damages";

interface DamageTypeSelectProps {
  value: DamageType | null;
  onValueChange: (value: DamageType) => void;
}

export const DamageTypeSelect = ({ value, onValueChange }: DamageTypeSelectProps) => {
  return (
    <div>
      <Label>Damage Type</Label>
      <Select 
        value={value || undefined} 
        onValueChange={(value) => onValueChange(value as DamageType)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select damage type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="scratches">Scratches</SelectItem>
          <SelectItem value="dents">Dents</SelectItem>
          <SelectItem value="paintwork">Paintwork Problems</SelectItem>
          <SelectItem value="windscreen">Windscreen Damages</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};