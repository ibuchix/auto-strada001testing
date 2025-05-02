
/**
 * Vehicle Status Section
 * Created: 2025-06-07
 * Contains fields related to the current status of the vehicle
 */

import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useFormData } from "../context/FormDataContext";

export const VehicleStatusSection = () => {
  const { form } = useFormData();
  
  if (!form) {
    return <div>Loading form...</div>;
  }
  
  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="isDamaged"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox
                checked={field.value || false}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>
                Does this vehicle have any damage?
              </FormLabel>
              <FormDescription>
                Check this if your vehicle has any damage (cosmetic or mechanical)
              </FormDescription>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="hasWarningLights"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox
                checked={field.value || false}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>
                Are there any warning lights showing on the dashboard?
              </FormLabel>
              <FormDescription>
                Check this if any warning lights are currently displayed
              </FormDescription>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="isRegisteredInPoland"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox
                checked={field.value || false}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>
                Is this vehicle registered in Poland?
              </FormLabel>
              <FormDescription>
                Check this if your vehicle has Polish registration
              </FormDescription>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {form.watch("isRegisteredInPoland") && (
        <FormField
          control={form.control}
          name="registration_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Registration Number</FormLabel>
              <FormControl>
                <Input placeholder="e.g. WA12345" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
};
