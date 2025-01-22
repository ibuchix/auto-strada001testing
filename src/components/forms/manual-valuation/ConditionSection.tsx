import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";

interface ConditionSectionProps {
  form: UseFormReturn<any>;
}

export const ConditionSection = ({ form }: ConditionSectionProps) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Vehicle Condition</h2>

      <FormField
        control={form.control}
        name="conditionRating"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Overall Condition</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={(value) => field.onChange(parseInt(value))}
                value={field.value?.toString()}
                className="grid grid-cols-5 gap-4"
              >
                {[1, 2, 3, 4, 5].map((rating) => (
                  <div key={rating} className="flex flex-col items-center">
                    <RadioGroupItem value={rating.toString()} id={`rating-${rating}`} />
                    <Label htmlFor={`rating-${rating}`}>{rating}</Label>
                  </div>
                ))}
              </RadioGroup>
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="accidentHistory"
        render={({ field }) => (
          <FormItem className="flex items-center space-x-2">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <FormLabel>Has accident history</FormLabel>
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="previousOwners"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Number of Previous Owners</FormLabel>
              <FormControl>
                <Input type="number" {...field} min="0" />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="serviceHistoryStatus"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service History Status</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g., Full, Partial, None" />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};