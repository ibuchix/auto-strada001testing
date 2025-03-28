
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";

interface VehicleStatusSectionProps {
  form: UseFormReturn<CarListingFormData>;
}

export const VehicleStatusSection = ({ form }: VehicleStatusSectionProps) => {
  return (
    <div className="space-y-4">
      <Label>Vehicle Status</Label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="isDamaged"
          render={({ field }) => (
            <FormItem className="flex items-center space-x-2">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel>Vehicle is damaged</FormLabel>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isRegisteredInPoland"
          render={({ field }) => (
            <FormItem className="flex items-center space-x-2">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel>Registered in Poland</FormLabel>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};
