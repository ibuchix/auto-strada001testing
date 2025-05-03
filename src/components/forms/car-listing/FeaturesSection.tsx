
/**
 * Changes made:
 * - Updated to use FormDataContext instead of requiring form prop
 * - 2025-07-25: Fixed type errors with form fields and feature names
 */
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useFormData } from "./context/FormDataContext";
import { Controller } from "react-hook-form";

export const FeaturesSection = () => {
  const { form } = useFormData();
  
  const features = {
    satNav: "Satellite Navigation",
    panoramicRoof: "Panoramic Roof",
    reverseCamera: "Reverse Camera",
    heatedSeats: "Heated Seats",
    upgradedSound: "Upgraded Sound System",
    bluetooth: "Bluetooth",
    sunroof: "Sunroof",
    alloyWheels: "Alloy Wheels"
  };

  return (
    <div className="space-y-4">
      <Label>Vehicle Features</Label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(Object.entries(features) as [keyof typeof features, string][]).map(([key, label]) => (
          <Controller
            key={key}
            control={form.control}
            name={`features.${key}`}
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel>{label}</FormLabel>
              </FormItem>
            )}
          />
        ))}
      </div>
    </div>
  );
};
