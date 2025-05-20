
/**
 * ConditionSection Component
 * Created: 2025-06-16
 * Updated: 2025-06-19 - Fixed type conversion issue and proper component exports
 * Updated: 2025-07-22 - Fixed type errors with field names
 * Updated: 2025-05-21 - Updated field names to use snake_case to match database schema
 * Updated: 2025-05-24 - Updated to use camelCase field names consistently
 * 
 * Vehicle condition section for car listing form
 */

import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useFormData } from "./context/FormDataContext";
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
                <Select 
                  value={field.value || ""} 
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select service history type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full Service History</SelectItem>
                    <SelectItem value="partial">Partial Service History</SelectItem>
                    <SelectItem value="none">No Service History</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>
    </div>
  );
};
