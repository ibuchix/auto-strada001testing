
/**
 * ServiceHistoryTypeSelector Component
 * Created: 2025-05-20
 * Updated: 2025-05-28 - Updated to use camelCase field names consistently
 * Updated: 2025-05-29 - Fixed TypeScript errors with prop types
 */

import React from "react";
import { useFormContext } from "react-hook-form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { FormControl, FormItem, FormLabel } from "@/components/ui/form";
import { CarListingFormData } from "@/types/forms";

interface ServiceHistoryTypeSelectorProps {
  form?: any; // Optional form prop for backward compatibility
}

export const ServiceHistoryTypeSelector: React.FC<ServiceHistoryTypeSelectorProps> = ({ form: formProp }) => {
  const formContext = useFormContext<CarListingFormData>();
  const { register, setValue } = formProp || formContext;
  
  const handleChange = (value: string) => {
    setValue("serviceHistoryType", value, { shouldDirty: true });
  };

  return (
    <FormItem className="space-y-3">
      <FormLabel className="text-base">What type of service history does the vehicle have?</FormLabel>
      <FormControl>
        <RadioGroup
          defaultValue="none"
          className="flex flex-col space-y-2"
          onValueChange={handleChange}
          {...register("serviceHistoryType")}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="full" id="full" />
            <Label htmlFor="full" className="font-normal">
              Full service history
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="partial" id="partial" />
            <Label htmlFor="partial" className="font-normal">
              Partial service history
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="none" id="none" />
            <Label htmlFor="none" className="font-normal">
              No service history
            </Label>
          </div>
        </RadioGroup>
      </FormControl>
    </FormItem>
  );
};
