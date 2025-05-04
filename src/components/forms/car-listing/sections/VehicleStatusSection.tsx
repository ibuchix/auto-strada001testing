
/**
 * Vehicle Status Section
 * Updated: 2025-05-04 - Updated to handle finance state properly
 * 
 * Section for collecting vehicle status information including damage, registration,
 * private plate, and outstanding finance status.
 */

import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { FormSection } from "../FormSection";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useFormData } from "../context/FormDataContext";

export const VehicleStatusSection = () => {
  const { form } = useFormData();
  
  return (
    <FormSection title="Vehicle Status">
      <CardHeader>
        <CardTitle>Vehicle Status</CardTitle>
        <CardDescription>
          Information about the current status of your vehicle
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 gap-y-6">
          {/* Is the vehicle damaged? */}
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
                    Is your vehicle damaged?
                  </FormLabel>
                  <FormDescription>
                    Check this if your vehicle has any significant damage
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
          
          {/* Is the vehicle registered in Poland? */}
          <FormField
            control={form.control}
            name="isRegisteredInPoland"
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
                    Is your vehicle registered in Poland?
                  </FormLabel>
                  <FormDescription>
                    Check this if your vehicle has Polish registration
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
          
          {/* Does the vehicle have a private plate? */}
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
                  <FormLabel>
                    Does your vehicle have a private plate?
                  </FormLabel>
                  <FormDescription>
                    Check this if your vehicle has a personalized license plate
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
          
          {/* Does the vehicle have outstanding finance? */}
          <FormField
            control={form.control}
            name="hasOutstandingFinance"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                      if (!checked) {
                        form.setValue("financeAmount", null);
                        form.setValue("financeProvider", "");
                      }
                    }}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Does your vehicle have outstanding finance?
                  </FormLabel>
                  <FormDescription>
                    Check this if your vehicle has a loan or finance agreement outstanding
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
          
          {/* Does the vehicle have service history? */}
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
                  <FormLabel>
                    Does your vehicle have service history?
                  </FormLabel>
                  <FormDescription>
                    Check this if you have service records for your vehicle
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </FormSection>
  );
};
