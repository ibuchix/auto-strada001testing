
/**
 * Changes made:
 * - Added more status options for better vehicle condition information
 * - Reorganized into logical groupings
 * - Fixed FormSection usage by adding required title prop
 * - Improved accessibility with better labeling
 * - Updated to use FormDataContext instead of requiring form prop
 * - Updated 2025-05-21: Updated field names to use snake_case to match database schema
 */

import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FormSection } from "./FormSection";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useFormData } from "./context/FormDataContext";

export const VehicleStatusSection = () => {
  const { form } = useFormData();
  const isDamaged = form.watch("is_damaged");
  
  return (
    <FormSection title="Vehicle Status">
      <CardHeader className="pb-3">
        <CardTitle>Vehicle Status</CardTitle>
        <CardDescription>
          Provide accurate information about your vehicle's current condition and status
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Registration Status */}
        <div className="space-y-4">
          <Label className="text-base">Registration Information</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="is_registered_in_poland"
              render={({ field }) => (
                <FormItem className="flex items-start space-x-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      id="is_registered_in_poland"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel htmlFor="is_registered_in_poland">Registered in Poland</FormLabel>
                    <FormDescription>
                      Vehicle is currently registered in Poland
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="has_private_plate"
              render={({ field }) => (
                <FormItem className="flex items-start space-x-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      id="has_private_plate"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel htmlFor="has_private_plate">Private Registration Plate</FormLabel>
                    <FormDescription>
                      Vehicle has a private/personalized plate
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>
        </div>
        
        {/* Condition Status */}
        <div className="space-y-4">
          <Label className="text-base">Vehicle Condition</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="is_damaged"
              render={({ field }) => (
                <FormItem className="flex items-start space-x-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      id="is_damaged"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel htmlFor="is_damaged">Vehicle is damaged</FormLabel>
                    <FormDescription>
                      Has visible damage or mechanical issues
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="has_warning_lights"
              render={({ field }) => (
                <FormItem className="flex items-start space-x-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      id="has_warning_lights"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel htmlFor="has_warning_lights">Warning Lights</FormLabel>
                    <FormDescription>
                      Dashboard warning lights are currently on
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>
        </div>
        
        {/* Ownership Status */}
        <div className="space-y-4">
          <Label className="text-base">Ownership Status</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="is_selling_on_behalf"
              render={({ field }) => (
                <FormItem className="flex items-start space-x-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      id="is_selling_on_behalf"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel htmlFor="is_selling_on_behalf">Selling on behalf</FormLabel>
                    <FormDescription>
                      Selling on behalf of someone else
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="has_outstanding_finance"
              render={({ field }) => (
                <FormItem className="flex items-start space-x-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      id="has_outstanding_finance"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel htmlFor="has_outstanding_finance">Outstanding Finance</FormLabel>
                    <FormDescription>
                      Vehicle has outstanding finance
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>
        </div>
        
        {/* Show additional fields if vehicle is damaged */}
        {isDamaged && (
          <div className="p-4 border rounded-md border-yellow-200 bg-yellow-50">
            <p className="text-sm text-yellow-800 mb-2">
              You've indicated that your vehicle has damage. Please provide details in the Damage section.
            </p>
          </div>
        )}
      </CardContent>
    </FormSection>
  );
};
