
/**
 * Changes made:
 * - Updated to use the standardized vehicle data storage and retrieval
 * - Added proper type handling for form values
 * - Improved form field initialization with more robust data fetching
 */

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect } from "react";
import { getStoredValidationData } from "@/services/supabase/valuation/vinValidationService";

export const VehicleDetailsSection = ({ form }) => {
  // Pre-fill form with data from the standardized localStorage structure
  useEffect(() => {
    const vehicleData = getStoredValidationData();
    
    if (vehicleData) {
      // Set form values with proper type conversion
      if (vehicleData.vin) {
        form.setValue('vin', vehicleData.vin);
      }
      
      if (vehicleData.mileage) {
        const mileageValue = typeof vehicleData.mileage === 'number' 
          ? vehicleData.mileage 
          : parseInt(String(vehicleData.mileage));
        form.setValue('mileage', mileageValue);
      }
      
      if (vehicleData.transmission) {
        form.setValue('transmission', vehicleData.transmission);
      }
      
      if (vehicleData.make) {
        form.setValue('make', vehicleData.make);
      }
      
      if (vehicleData.model) {
        form.setValue('model', vehicleData.model);
      }
      
      if (vehicleData.year) {
        const yearValue = typeof vehicleData.year === 'number' 
          ? vehicleData.year 
          : parseInt(String(vehicleData.year));
        form.setValue('year', yearValue.toString());
      }
      
      // Fallback to legacy localStorage format for backward compatibility
      if (!vehicleData.vin || !vehicleData.mileage || !vehicleData.transmission) {
        const vin = localStorage.getItem('tempVIN');
        const mileage = localStorage.getItem('tempMileage');
        const gearbox = localStorage.getItem('tempGearbox');
        
        if (vin && !vehicleData.vin) {
          form.setValue('vin', vin);
        }
        
        if (mileage && !vehicleData.mileage) {
          form.setValue('mileage', mileage);
        }
        
        if (gearbox && !vehicleData.transmission) {
          form.setValue('transmission', gearbox);
        }
      }
    } else {
      // Fallback to legacy localStorage format
      const vin = localStorage.getItem('tempVIN');
      const mileage = localStorage.getItem('tempMileage');
      const gearbox = localStorage.getItem('tempGearbox');
      
      if (vin) {
        form.setValue('vin', vin);
      }
      
      if (mileage) {
        form.setValue('mileage', mileage);
      }
      
      if (gearbox) {
        form.setValue('transmission', gearbox);
      }
    }
  }, [form]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 40 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Vehicle Details</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="make"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Make</FormLabel>
              <FormControl>
                <Input placeholder="e.g. BMW" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="model"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Model</FormLabel>
              <FormControl>
                <Input placeholder="e.g. 3 Series" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="year"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Year</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value?.toString() || ''}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="mileage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mileage</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="e.g. 50000" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="engineCapacity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Engine Capacity (cc)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="e.g. 2000" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="transmission"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Transmission</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Transmission" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="automatic">Automatic</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="vin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>VIN (Vehicle Identification Number)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g. WBAJC310X0G806970" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="registrationNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Registration Number (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g. AB123CD" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="previousOwners"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Number of Previous Owners</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min="0"
                  placeholder="e.g. 2" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};
