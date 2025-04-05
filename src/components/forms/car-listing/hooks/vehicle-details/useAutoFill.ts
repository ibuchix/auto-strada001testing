
/**
 * Hook to handle auto-filling vehicle details from stored validation data
 * 
 * Changes made:
 * - 2025-04-06: Updated to use the centralized vehicle data service
 * - 2025-04-06: Improved type conversion for numeric fields
 * - 2025-04-06: Added detailed error handling and debugging logs
 * - 2025-04-06: Added validation before applying values
 */
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { toast } from "sonner";
import { 
  getVehicleData, 
  hasCompleteVehicleData,
  applyVehicleDataToForm
} from "@/services/vehicleDataService";
import { toNumberValue } from "@/utils/typeConversion";

export const useAutoFill = (form: UseFormReturn<CarListingFormData>) => {
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  
  // Auto-fill form with stored vehicle data
  const handleAutoFill = async () => {
    console.log('Starting auto-fill process');
    
    if (!hasCompleteVehicleData()) {
      console.warn('Auto-fill attempted with incomplete vehicle data');
      toast.error("No complete vehicle data found", {
        description: "Please complete a VIN check first to auto-fill details"
      });
      return;
    }
    
    setIsAutoFilling(true);
    
    try {
      const vehicleData = getVehicleData();
      
      if (!vehicleData) {
        console.error('Failed to retrieve vehicle data during auto-fill');
        toast.error('No vehicle data available', {
          description: 'Please complete a VIN check first'
        });
        return;
      }
      
      console.log('Auto-filling with vehicle data:', vehicleData);
      
      // Apply the vehicle data to the form
      const success = applyVehicleDataToForm(form, true);
      
      if (!success) {
        console.error('Auto-fill application failed');
        toast.error('Failed to auto-fill vehicle details', {
          description: 'Please try again or enter details manually'
        });
      } else {
        console.log('Auto-fill completed successfully');
      }
    } catch (error) {
      console.error('Error during auto-fill:', error);
      toast.error('Failed to auto-fill vehicle details', {
        description: 'Please try again or enter details manually'
      });
    } finally {
      setIsAutoFilling(false);
    }
  };
  
  return {
    handleAutoFill,
    isAutoFilling
  };
};
