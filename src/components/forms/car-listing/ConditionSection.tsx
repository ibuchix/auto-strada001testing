
/**
 * Vehicle Condition Information Section
 * Created: 2025-05-02
 * 
 * This component handles the collection of vehicle condition information
 */

import { useFormData } from "./context/FormDataContext";
import { FormSection } from "./FormSection";
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

export const ConditionSection = () => {
  const { form } = useFormData();
  
  return (
    <FormSection 
      title="Vehicle Condition" 
      subtitle="Tell us about the condition of your vehicle"
    >
      <div className="space-y-6">
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
                <FormLabel>Vehicle Has Damage</FormLabel>
                <FormDescription>
                  Check this box if your vehicle has any damage that should be disclosed.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="hasServiceHistory"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Has Service History</FormLabel>
                <FormDescription>
                  Check this box if you have service history documentation for the vehicle.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="hasFinance"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Has Finance Outstanding</FormLabel>
                <FormDescription>
                  Check this box if the vehicle has outstanding finance.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="hasPrivatePlate"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Has Private Registration Plate</FormLabel>
                <FormDescription>
                  Check this box if the vehicle has a private registration plate.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="additionalInfo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Information</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Any additional information about your vehicle's condition..."
                  className="resize-y min-h-[100px]" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </FormSection>
  );
};
