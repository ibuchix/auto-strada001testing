
/**
 * FeaturesSection Component
 * Displays and handles car feature selections
 * Updated: 2025-05-03 - Fixed TypeScript errors related to CarFeatures type
 */

import { useFormData } from "../context/FormDataContext";
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { CarFeatures } from "@/types/forms";

export const FeaturesSection = () => {
  const { form } = useFormData();
  
  // Initialize features with default values if not set
  const featuresValue = form.watch('features') || {
    airConditioning: false,
    bluetooth: false,
    cruiseControl: false,
    leatherSeats: false,
    navigation: false,
    parkingSensors: false,
    sunroof: false,
    alloyWheels: false,
    heatedSeats: false,
    reverseCamera: false,
    keylessEntry: false,
    adaptiveCruiseControl: false,
    laneDepartureWarning: false
  } as CarFeatures;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Features</h3>
      <p className="text-sm text-gray-500">Select all features that apply to this vehicle</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="features.airConditioning"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={featuresValue.airConditioning || false}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="font-normal">Air Conditioning</FormLabel>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="features.bluetooth"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={featuresValue.bluetooth || false}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="font-normal">Bluetooth</FormLabel>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="features.cruiseControl"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={featuresValue.cruiseControl || false}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="font-normal">Cruise Control</FormLabel>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="features.leatherSeats"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={featuresValue.leatherSeats || false}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="font-normal">Leather Seats</FormLabel>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="features.navigation"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={featuresValue.navigation || false}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="font-normal">Navigation System</FormLabel>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="features.parkingSensors"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={featuresValue.parkingSensors || false}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="font-normal">Parking Sensors</FormLabel>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="features.sunroof"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={featuresValue.sunroof || false}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="font-normal">Sunroof</FormLabel>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="features.alloyWheels"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={featuresValue.alloyWheels || false}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="font-normal">Alloy Wheels</FormLabel>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="features.heatedSeats"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={featuresValue.heatedSeats || false}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="font-normal">Heated Seats</FormLabel>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="features.reverseCamera"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={featuresValue.reverseCamera || false}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="font-normal">Reverse Camera</FormLabel>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};
