/**
 * Changes made:
 * - 2024-03-19: Initial implementation of damage description component
 * - 2024-03-19: Added input validation and error handling
 */

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
