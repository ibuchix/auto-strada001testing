
/**
 * Hook to handle auto-filling vehicle details from stored validation data
 */
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { toast } from "sonner";
import { getStoredValidationData } from "@/services/supabase/valuation/vinValidationService";

export const useAutoFill = (form: UseFormReturn<CarListingFormData>) => {
  // Auto-fill form with stored vehicle data
  const handleAutoFill = () => {
    // Log start of auto-fill process for debugging
    console.log('Starting auto-fill process');
    
    const data = getStoredValidationData();
    
    if (!data) {
      toast.error("No vehicle data found", {
        description: "Please complete a VIN check first to auto-fill details"
      });
      return;
    }
    
    try {
      console.log('Auto-filling with data:', data);
      
      // Fill in all available fields with proper type conversion
      if (data.make) {
        console.log('Setting make:', data.make);
        form.setValue('make', data.make);
      }
      
      if (data.model) {
        console.log('Setting model:', data.model);
        form.setValue('model', data.model);
      }
      
      // Handle year with proper type conversion
      if (data.year) {
        const yearValue = typeof data.year === 'number' 
          ? data.year 
          : parseInt(String(data.year));
        console.log('Setting year:', yearValue);
        form.setValue('year', yearValue);
      }
      
      // Handle mileage with proper type conversion
      if (data.mileage) {
        const mileageValue = typeof data.mileage === 'number' 
          ? data.mileage 
          : parseInt(String(data.mileage));
        console.log('Setting mileage:', mileageValue);
        form.setValue('mileage', mileageValue);
      }
      
      if (data.vin) {
        console.log('Setting VIN:', data.vin);
        form.setValue('vin', data.vin);
      }
      
      if (data.transmission) {
        console.log('Setting transmission:', data.transmission);
        form.setValue('transmission', data.transmission);
      }
      
      toast.success("Vehicle details auto-filled", {
        description: `Successfully populated data for ${data.year} ${data.make} ${data.model}`
      });
    } catch (error) {
      console.error('Error during auto-fill:', error);
      toast.error('Failed to auto-fill vehicle details', {
        description: 'Please try again or enter details manually'
      });
    }
  };
  
  return {
    handleAutoFill
  };
};
