
/**
 * Special VehicleStatusSection component for manual valuation form
 * - Uses direct form prop instead of context
 * - Simplified from the car listing version
 */

import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface VehicleStatusSectionProps {
  form: UseFormReturn<CarListingFormData>;
}

export const VehicleStatusSection = ({ form }: VehicleStatusSectionProps) => {
  const isDamaged = form.watch("isDamaged");
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Vehicle Status</h2>
      
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
    </div>
  );
};
