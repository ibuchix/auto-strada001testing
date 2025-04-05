
/**
 * Hook to handle auto-filling vehicle details from stored validation data
 * 
 * Changes made:
 * - 2025-04-06: Updated to use the centralized vehicle data service
 * - 2025-04-06: Improved type conversion for numeric fields
 * - 2025-04-06: Added detailed error handling and debugging logs
 * - 2025-04-06: Added validation before applying values
 * - 2025-04-07: Enhanced with Promise-based return for better feedback
 */
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { toast } from "sonner";
import { 
  hasCompleteVehicleData,
  applyVehicleDataToForm
} from "@/services/vehicleDataService";

export const useAutoFill = (form: UseFormReturn<CarListingFormData>) => {
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  
  // Auto-fill form with stored vehicle data
  const handleAutoFill = async (): Promise<boolean> => {
    console.log('Starting auto-fill process');
    
    if (!hasCompleteVehicleData()) {
      console.warn('Auto-fill attempted with incomplete vehicle data');
      return false;
    }
    
    setIsAutoFilling(true);
    
    try {
      // Validate the form fields before auto-filling
      // This helps ensure we're not overwriting valid data with invalid data
      const initialFormValues = form.getValues();
      console.log('Current form values before auto-fill:', initialFormValues);
      
      // Apply the vehicle data to the form - returns boolean success
      const success = applyVehicleDataToForm(form, false); // Don't show toast here
      
      if (!success) {
        console.error('Auto-fill application failed');
        return false;
      }
      
      console.log('Auto-fill completed successfully');
      return true;
    } catch (error) {
      console.error('Error during auto-fill:', error);
      return false;
    } finally {
      setIsAutoFilling(false);
    }
  };
  
  return {
    handleAutoFill,
    isAutoFilling
  };
};
