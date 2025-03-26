import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";

interface ConditionSectionProps {
  form: UseFormReturn<CarListingFormData>;
}

export const ConditionSection = ({ form }: ConditionSectionProps) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-dark">Vehicle Condition</h2>
      
      <div className="grid gap-6 p-6 bg-accent/30 rounded-lg">
        <div className="space-y-4">
          <FormLabel className="text-base font-semibold">Overall Condition</FormLabel>
          <FormField
            control={form.control}
            name="conditionRating"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <RadioGroup
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={field.value?.toString()}
                    className="flex justify-between space-x-2"
                  >
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <FormItem key={rating} className="flex flex-col items-center space-y-2">
                        <FormControl>
                          <RadioGroupItem
                            value={rating.toString()}
                            className="size-5 border-2 border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                        </FormControl>
                        <FormLabel className="font-normal text-sm">{rating}</FormLabel>
                      </FormItem>
                    ))}
                  </RadioGroup>
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="accidentHistory"
          render={({ field }) => (
            <FormItem className="flex items-center space-x-2">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="border-2 border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
              </FormControl>
              <FormLabel className="font-normal">Has accident history</FormLabel>
            </FormItem>
          )}
        />

        <div className="grid md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="previousOwners"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of Previous Owners</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Enter number of previous owners"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    className="bg-white"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
};