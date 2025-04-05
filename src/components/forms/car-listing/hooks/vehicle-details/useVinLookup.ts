
/**
 * Hook to handle VIN lookup functionality
 */
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { toast } from "sonner";
import { 
  validateVin, 
  VehicleData 
} from "@/services/supabase/valuation/vinValidationService";

export const useVinLookup = (form: UseFormReturn<CarListingFormData>) => {
  const [isLoading, setIsLoading] = useState(false);
  const [storedVehicleData, setStoredVehicleData] = useState<VehicleData | null>(null);
  
  // Handle VIN lookup
  const handleVinLookup = async (vin: string) => {
    if (!vin || vin.length < 17) {
      toast.error('Please enter a valid 17-character VIN');
      return;
    }
    
    setIsLoading(true);
    try {
      // Get the mileage value from the form if it exists
      const mileage = form.getValues('mileage') || 0;
      
      // Call the VIN validation service
      const response = await validateVin({
        vin,
        mileage
      });
      
      if (!response.success) {
        toast.error(response.error || 'VIN validation failed');
        return;
      }
      
      // Store locally for auto-fill operations
      if (response.data) {
        setStoredVehicleData(response.data);
        
        // Auto-fill form with fetched data
        if (response.data.make) form.setValue('make', response.data.make);
        if (response.data.model) form.setValue('model', response.data.model);
        if (response.data.year) form.setValue('year', typeof response.data.year === 'number' ? response.data.year : parseInt(String(response.data.year)));
        if (response.data.mileage) form.setValue('mileage', typeof response.data.mileage === 'number' ? response.data.mileage : parseInt(String(response.data.mileage)));
        if (response.data.vin) form.setValue('vin', response.data.vin);
        if (response.data.transmission) form.setValue('transmission', response.data.transmission);
        
        toast.success('VIN lookup successful!', {
          description: `Found: ${response.data.year} ${response.data.make} ${response.data.model}`
        });
      } else {
        toast.warning('VIN validation succeeded but no vehicle data was returned');
      }
    } catch (error) {
      console.error('VIN lookup error:', error);
      toast.error('Failed to lookup VIN information');
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    isLoading,
    storedVehicleData,
    handleVinLookup
  };
};
