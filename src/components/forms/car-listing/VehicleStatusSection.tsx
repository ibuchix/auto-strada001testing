/**
 * Vehicle Status Section Component
 * 2025-06-15: isDamaged is just a checkbox, no longer opens a tab or triggers other UI.
 * Updated: 2025-05-20 - Updated field names to use snake_case to match database schema
 * Updated: 2025-05-24 - Updated to use camelCase field names consistently
 */

import { useFormData } from "./context/FormDataContext";
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const VehicleStatusSection = () => {
  const { form } = useFormData();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vehicle Status</CardTitle>
        <CardDescription>
          Please provide details about your vehicle's current condition and status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Has Private Registration Plate */}
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
                  <FormLabel>Private Registration Plate</FormLabel>
                  <FormDescription>
                    Check if the vehicle has a private registration plate that will be kept
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
          
          {/* Is Registered in Poland */}
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
                  <FormLabel>Registered in Poland</FormLabel>
                  <FormDescription>
                    Check if the vehicle is currently registered in Poland
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>
        {/* Is Damaged: Simple Checkbox, no tabs/new UI */}
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
                <FormLabel>Vehicle has damage</FormLabel>
                <FormDescription>
                  Mark this if the vehicle has any notable damage. The auction admin will review if more detail is needed.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};
