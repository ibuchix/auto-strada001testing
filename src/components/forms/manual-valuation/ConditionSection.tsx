
/**
 * Changes made:
 * - 2025-08-19: Fixed CheckedState type issue
 */

import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { toBooleanValue } from "@/utils/typeConversion";

interface ConditionSectionProps {
  form: UseFormReturn<CarListingFormData>;
}

export const ConditionSection = ({ form }: ConditionSectionProps) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Vehicle Condition</h2>
      
      <FormField
        control={form.control}
        name="conditionRating"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>Overall Condition</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={(value) => field.onChange(parseInt(value, 10))}
                defaultValue={field.value?.toString() || "3"}
                className="flex space-x-4"
              >
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <RadioGroupItem value="1" />
                  </FormControl>
                  <FormLabel className="cursor-pointer">Poor</FormLabel>
                </FormItem>
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <RadioGroupItem value="2" />
                  </FormControl>
                  <FormLabel className="cursor-pointer">Fair</FormLabel>
                </FormItem>
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <RadioGroupItem value="3" />
                  </FormControl>
                  <FormLabel className="cursor-pointer">Good</FormLabel>
                </FormItem>
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <RadioGroupItem value="4" />
                  </FormControl>
                  <FormLabel className="cursor-pointer">Excellent</FormLabel>
                </FormItem>
              </RadioGroup>
            </FormControl>
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="isDamaged"
        render={({ field }) => (
          <FormItem className="flex items-center space-x-2">
            <FormControl>
              <Checkbox 
                checked={toBooleanValue(field.value)} 
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <FormLabel>Vehicle has damage</FormLabel>
          </FormItem>
        )}
      />
    </div>
  );
};
