
/**
 * ConditionSection Component
 * Created: 2025-06-16
 * 
 * Vehicle condition section for car listing form
 */

import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useFormData } from "../context/FormDataContext";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export const ConditionSection = () => {
  const { form } = useFormData();
  
  const serviceHistoryVisible = form.watch("hasServiceHistory");
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Vehicle Condition</h2>
      
      <div className="space-y-6">
        <FormField
          control={form.control}
          name="isDamaged"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1">
                <FormLabel>Vehicle has damage</FormLabel>
                <FormDescription>
                  Check this box if your vehicle has any damage that needs to be declared.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="hasServiceHistory"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1">
                <FormLabel>Service History Available</FormLabel>
                <FormDescription>
                  Check this box if you have service history for the vehicle.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        
        {serviceHistoryVisible && (
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
                    className="flex flex-col space-y-1"
                  >
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="full" />
                      </FormControl>
                      <FormLabel className="font-normal">Full Service History</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="partial" />
                      </FormControl>
                      <FormLabel className="font-normal">Partial Service History</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>
    </div>
  );
};
