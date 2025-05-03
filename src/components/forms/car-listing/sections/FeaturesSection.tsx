
/**
 * FeaturesSection Component
 * Updated: 2025-05-04 - Fixed TypeScript error with proper initialization of CarFeatures
 */

import { useFormData } from "../context/FormDataContext";
import { FormField, FormItem, FormControl, FormLabel } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { CarFeatures } from "@/types/forms";
import { useEffect } from "react";

export const FeaturesSection = () => {
  const { form } = useFormData();
  
  // Ensure features object is initialized properly
  useEffect(() => {
    const currentFeatures = form.watch('features');
    if (!currentFeatures || typeof currentFeatures !== 'object') {
      const defaultFeatures: CarFeatures = {
        airConditioning: false,
        bluetooth: false,
        cruiseControl: false,
        leatherSeats: false,
        navigation: false,
        parkingSensors: false,
        sunroof: false,
        satNav: false,
        panoramicRoof: false,
        reverseCamera: false,
        heatedSeats: false,
        upgradedSound: false,
        alloyWheels: false,
        keylessEntry: false,
        adaptiveCruiseControl: false,
        laneDepartureWarning: false
      };
      form.setValue('features', defaultFeatures);
    }
  }, [form]);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Vehicle Features</h3>
      <p className="text-sm text-muted-foreground">
        Check all features that apply to your vehicle
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="features.airConditioning"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
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
            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
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
            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
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
            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
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
            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
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
            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
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
            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
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
            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
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
            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
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
            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="font-normal">Reverse Camera</FormLabel>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="features.keylessEntry"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="font-normal">Keyless Entry</FormLabel>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="features.adaptiveCruiseControl"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="font-normal">Adaptive Cruise Control</FormLabel>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};
