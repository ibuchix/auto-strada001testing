
/**
 * Hook to handle auto-filling vehicle details from stored validation data
 * 
 * Changes made:
 * - 2025-04-06: Updated to use the centralized vehicle data service
 * - Added better error handling and debugging
 * - Improved type safety for form values
 */
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { toast } from "sonner";
import { applyVehicleDataToForm, hasCompleteVehicleData } from "@/services/vehicleDataService";

export const useAutoFill = (form: UseFormReturn<CarListingFormData>) => {
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  
  // Auto-fill form with stored vehicle data
  const handleAutoFill = async () => {
    // Log start of auto-fill process for debugging
    console.log('Starting auto-fill process');
    
    if (!hasCompleteVehicleData()) {
      toast.error("No complete vehicle data found", {
        description: "Please complete a VIN check first to auto-fill details"
      });
      return;
    }
    
    setIsAutoFilling(true);
    
    try {
      const success = applyVehicleDataToForm(form);
      
      if (!success) {
        console.error('Auto-fill failed');
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
