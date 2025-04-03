
/**
 * Service History Section component specific for manual valuation form
 * - Uses FormDataContext to access form
 * - Simplified from the car listing version
 */
import { useFormData } from "../../car-listing/context/FormDataContext";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { FormField, FormItem, FormControl, FormLabel, FormMessage } from "@/components/ui/form";

export const ServiceHistorySection = () => {
  const { form } = useFormData();
  
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold mb-4">Service History</h3>
      
      <FormField
        control={form.control}
        name="serviceHistoryType"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>Service History Type</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                value={field.value}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="full" id="full" />
                  <Label htmlFor="full">Full service history</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="partial" id="partial" />
                  <Label htmlFor="partial">Partial service history</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="none" id="none" />
                  <Label htmlFor="none">No service history</Label>
                </div>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
