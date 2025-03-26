
/**
 * Fixed checked state type
 */

import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";

interface ConditionSectionProps {
  form: UseFormReturn<CarListingFormData>;
}

export const ConditionSection = ({ form }: ConditionSectionProps) => {
  const [conditionRating, setConditionRating] = useState(form.getValues().conditionRating || 3);
  const [isDamaged, setIsDamaged] = useState(form.getValues().isDamaged || false);

  useEffect(() => {
    form.setValue('conditionRating', conditionRating, { shouldDirty: true });
  }, [conditionRating, form]);

  useEffect(() => {
    form.setValue('isDamaged', isDamaged, { shouldDirty: true });
  }, [isDamaged, form]);

  const getConditionLabel = (rating: number) => {
    switch (rating) {
      case 1: return "Poor";
      case 2: return "Fair";
      case 3: return "Good";
      case 4: return "Very Good";
      case 5: return "Excellent";
      default: return "Good";
    }
  };

  return (
    <Card className="p-4 md:p-6">
      <h2 className="text-xl md:text-2xl font-oswald font-bold mb-6 text-dark border-b pb-4">
        Vehicle Condition
      </h2>

      <div className="space-y-6">
        <div>
          <Label className="text-lg font-medium mb-4 block">Overall Condition Rating</Label>
          <div className="space-y-4">
            <Slider 
              value={[conditionRating]} 
              min={1} 
              max={5} 
              step={1} 
              onValueChange={(vals) => setConditionRating(vals[0])}
              className="mt-6"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Poor</span>
              <span>Fair</span>
              <span>Good</span>
              <span>Very Good</span>
              <span>Excellent</span>
            </div>
            <div className="text-center font-medium text-lg mt-4">
              {getConditionLabel(conditionRating)}
            </div>
          </div>
        </div>

        <div className="pt-4">
          <div className="flex items-start space-x-2">
            <Checkbox 
              id="isDamaged" 
              checked={isDamaged} 
              onCheckedChange={(checked: boolean) => setIsDamaged(checked)}
            />
            <div>
              <Label htmlFor="isDamaged" className="font-medium">
                Vehicle has damage
              </Label>
              <p className="text-sm text-muted-foreground">
                Select this if your vehicle has any visible damage, mechanical issues, or warning lights.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <Label className="text-lg font-medium mb-4 block">Accident History</Label>
          <RadioGroup 
            defaultValue={form.getValues().accidentHistory || "none"}
            onValueChange={(value) => {
              form.setValue('accidentHistory', value, { shouldDirty: true });
            }}
          >
            <div className="flex items-start space-x-2 mb-4">
              <RadioGroupItem value="none" id="accident-none" />
              <div>
                <Label htmlFor="accident-none" className="font-medium">No accidents</Label>
                <p className="text-sm text-muted-foreground">
                  The vehicle has never been in an accident
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-2 mb-4">
              <RadioGroupItem value="minor" id="accident-minor" />
              <div>
                <Label htmlFor="accident-minor" className="font-medium">Minor accidents</Label>
                <p className="text-sm text-muted-foreground">
                  The vehicle has been in minor accidents (e.g., fender benders)
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <RadioGroupItem value="major" id="accident-major" />
              <div>
                <Label htmlFor="accident-major" className="font-medium">Major accidents</Label>
                <p className="text-sm text-muted-foreground">
                  The vehicle has been in at least one major accident
                </p>
              </div>
            </div>
          </RadioGroup>
        </div>
      </div>
    </Card>
  );
};
