
/**
 * Changes made:
 * - 2025-12-10: Updated component to properly handle required CarFeatures properties
 */

import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";

interface FeaturesSectionProps {
  form: UseFormReturn<CarListingFormData>;
}

export const FeaturesSection = ({ form }: FeaturesSectionProps) => {
  // Define features with their display labels
  const features = {
    satNav: "Satellite Navigation",
    panoramicRoof: "Panoramic Roof",
    reverseCamera: "Reverse Camera",
    heatedSeats: "Heated Seats",
    upgradedSound: "Upgraded Sound System",
  };

  return (
    <div className="space-y-4">
      <Label>Vehicle Features</Label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(Object.entries(features) as [keyof typeof features, string][]).map(([key, label]) => (
          <FormField
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
