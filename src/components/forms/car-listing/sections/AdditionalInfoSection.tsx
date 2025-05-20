
/**
 * AdditionalInfoSection Component
 * Created: 2025-05-11
 * Updated: 2025-05-24 - Fixed field names to use camelCase consistently
 * 
 * Creates a new component in the sections directory to ensure consistent import paths
 * and fix the "Right side of assignment cannot be destructured" error
 */

import { Card } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFormData } from "../context/FormDataContext";
import { FormSection } from "../FormSection";
import { Controller } from "react-hook-form";

export const AdditionalInfoSection = () => {
  const { form } = useFormData();

  return (
    <FormSection 
      title="Additional Information"
      subtitle="Additional details about your vehicle"
    >
      <div className="space-y-6">
        {/* Seat Material */}
        <Controller
          control={form.control}
          name="seatMaterial"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Seat Material</FormLabel>
              <Select 
                value={field.value || ""} 
                onValueChange={field.onChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select seat material" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="leather">Leather</SelectItem>
                  <SelectItem value="cloth">Cloth</SelectItem>
                  <SelectItem value="leatherette">Leatherette</SelectItem>
                  <SelectItem value="alcantara">Alcantara</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Number of Keys */}
        <Controller
          control={form.control}
          name="numberOfKeys"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Number of Keys</FormLabel>
              <Select 
                value={field.value ? field.value.toString() : ""} 
                onValueChange={field.onChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select number of keys" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4+">4+</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Registered in Poland */}
        <Controller
          control={form.control}
          name="isRegisteredInPoland"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Is the vehicle registered in Poland?</FormLabel>
              <RadioGroup
                value={field.value?.toString() || ""}
                onValueChange={(value) => field.onChange(value === "true")}
                className="flex flex-col space-y-1"
              >
                <FormItem className="flex items-center space-x-3 space-y-0">
                  <RadioGroupItem value="true" id="isRegisteredInPoland-yes" />
                  <FormLabel htmlFor="isRegisteredInPoland-yes" className="font-normal">
                    Yes
                  </FormLabel>
                </FormItem>
                <FormItem className="flex items-center space-x-3 space-y-0">
                  <RadioGroupItem value="false" id="isRegisteredInPoland-no" />
                  <FormLabel htmlFor="isRegisteredInPoland-no" className="font-normal">
                    No
                  </FormLabel>
                </FormItem>
              </RadioGroup>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Warning Lights */}
        <Controller
          control={form.control}
          name="hasWarningLights"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Are there any warning lights on the dashboard?</FormLabel>
              <RadioGroup
                value={field.value?.toString() || ""}
                onValueChange={(value) => field.onChange(value === "true")}
                className="flex flex-col space-y-1"
              >
                <FormItem className="flex items-center space-x-3 space-y-0">
                  <RadioGroupItem value="true" id="hasWarningLights-yes" />
                  <FormLabel htmlFor="hasWarningLights-yes" className="font-normal">
                    Yes
                  </FormLabel>
                </FormItem>
                <FormItem className="flex items-center space-x-3 space-y-0">
                  <RadioGroupItem value="false" id="hasWarningLights-no" />
                  <FormLabel htmlFor="hasWarningLights-no" className="font-normal">
                    No
                  </FormLabel>
                </FormItem>
              </RadioGroup>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </FormSection>
  );
};
