
/**
 * Changes made:
 * - 2024-08-04: Fixed checkbox state handling to use boolean instead of string
 */

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";

interface ConditionSectionProps {
  form: UseFormReturn<CarListingFormData>;
}

export const ConditionSection = ({ form }: ConditionSectionProps) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Vehicle Condition</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <FormField
          control={form.control}
          name="conditionRating"
          render={({ field }) => (
            <FormItem className="space-y-4">
              <FormLabel>Overall Condition</FormLabel>
              <FormDescription>
                Rate the overall condition of your vehicle from 1 (Poor) to 5 (Excellent)
              </FormDescription>
              <Slider
                min={1}
                max={5}
                step={1}
                defaultValue={[field.value]}
                onValueChange={(values) => field.onChange(values[0])}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Poor</span>
                <span>Fair</span>
                <span>Good</span>
                <span>Very Good</span>
                <span>Excellent</span>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isDamaged"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Vehicle has damage
                </FormLabel>
                <FormDescription>
                  Check this if your vehicle has any visible damage or mechanical issues
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="serviceHistoryType"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Service History</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="full" id="full" />
                    <Label htmlFor="full">Full Service History</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="partial" id="partial" />
                    <Label htmlFor="partial">Partial Service History</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="none" id="none" />
                    <Label htmlFor="none">No Service History</Label>
                  </div>
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};
