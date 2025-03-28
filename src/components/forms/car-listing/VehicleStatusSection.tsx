
/**
 * Changes made:
 * - Added more status options for better vehicle condition information
 * - Reorganized into logical groupings
 * - Added section title and description
 * - Improved accessibility with better labeling
 */

import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { FormSection } from "./FormSection";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface VehicleStatusSectionProps {
  form: UseFormReturn<CarListingFormData>;
}

export const VehicleStatusSection = ({ form }: VehicleStatusSectionProps) => {
  const isDamaged = form.watch("isDamaged");
  
  return (
    <FormSection>
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
              name="isRegisteredInPoland"
              render={({ field }) => (
                <FormItem className="flex items-start space-x-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      id="isRegisteredInPoland"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel htmlFor="isRegisteredInPoland">Registered in Poland</FormLabel>
                    <FormDescription>
                      Vehicle is currently registered in Poland
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="hasPrivatePlate"
              render={({ field }) => (
                <FormItem className="flex items-start space-x-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      id="hasPrivatePlate"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel htmlFor="hasPrivatePlate">Private Registration Plate</FormLabel>
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
              name="isDamaged"
              render={({ field }) => (
                <FormItem className="flex items-start space-x-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      id="isDamaged"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel htmlFor="isDamaged">Vehicle is damaged</FormLabel>
                    <FormDescription>
                      Has visible damage or mechanical issues
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="hasWarningLights"
              render={({ field }) => (
                <FormItem className="flex items-start space-x-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      id="hasWarningLights"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel htmlFor="hasWarningLights">Warning Lights</FormLabel>
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
              name="isSellingOnBehalf"
              render={({ field }) => (
                <FormItem className="flex items-start space-x-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      id="isSellingOnBehalf"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel htmlFor="isSellingOnBehalf">Selling on behalf</FormLabel>
                    <FormDescription>
                      Selling on behalf of someone else
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="hasOutstandingFinance"
              render={({ field }) => (
                <FormItem className="flex items-start space-x-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      id="hasOutstandingFinance"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel htmlFor="hasOutstandingFinance">Outstanding Finance</FormLabel>
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
