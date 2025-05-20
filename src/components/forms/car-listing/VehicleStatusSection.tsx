
/**
 * Vehicle Status Section Component
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
                    Check if the vehicle is registered in Poland
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          {/* Has Service History */}
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
                  <FormLabel>Service History</FormLabel>
                  <FormDescription>
                    Check if the vehicle has service history documentation
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          {/* Has Damage */}
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
                  <FormLabel>Vehicle Damage</FormLabel>
                  <FormDescription>
                    Check if the vehicle has any damage or defects
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          {/* Has Outstanding Finance */}
          <FormField
            control={form.control}
            name="hasOutstandingFinance"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Outstanding Finance</FormLabel>
                  <FormDescription>
                    Check if the vehicle has outstanding finance
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          {/* Has Warning Lights */}
          <FormField
            control={form.control}
            name="hasWarningLights"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Warning Lights</FormLabel>
                  <FormDescription>
                    Check if any warning lights are displayed on the dashboard
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          {/* Is Selling on Behalf of Someone */}
          <FormField
            control={form.control}
            name="isSellingOnBehalf"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Selling on Behalf</FormLabel>
                  <FormDescription>
                    Check if you are selling this vehicle on behalf of someone else
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
};
