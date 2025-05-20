
/**
 * Changes made:
 * - Updated to use FormDataContext instead of requiring form prop
 * - 2025-07-25: Fixed type errors with form fields and feature names
 * - 2025-07-26: Fixed feature checkboxes and context usage
 * - 2025-05-21: Updated to properly use typed features from CarFeatures interface
 */
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useFormData } from "./context/FormDataContext";
import { Controller } from "react-hook-form";
import { CarFeatures } from "@/types/forms";

export const FeaturesSection = () => {
  const { form } = useFormData();
  
  const features: Record<string, string> = {
    airConditioning: "Air Conditioning",
    bluetooth: "Bluetooth",
    cruiseControl: "Cruise Control",
    leatherSeats: "Leather Seats",
    navigation: "Navigation",
    parkingSensors: "Parking Sensors",
    sunroof: "Sunroof",
    satNav: "Satellite Navigation",
    panoramicRoof: "Panoramic Roof",
    reverseCamera: "Reverse Camera",
    heatedSeats: "Heated Seats",
    upgradedSound: "Upgraded Sound System",
    alloyWheels: "Alloy Wheels"
  };

  return (
    <div className="space-y-4">
      <Label>Vehicle Features</Label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(features).map(([key, label]) => (
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
