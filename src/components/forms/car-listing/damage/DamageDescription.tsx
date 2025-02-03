import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DamageDescriptionProps {
  value: string;
  onChange: (value: string) => void;
}

export const DamageDescription = ({ value, onChange }: DamageDescriptionProps) => {
  return (
    <div>
      <Label>Description</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Describe the damage"
      />
    </div>
  );
};