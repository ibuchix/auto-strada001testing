
/**
 * Changes made:
 * - Enhanced integration with vehicle data handling hooks
 * - Improved promise handling for auto-fill functionality
 * - Added better error reporting and validation
 */

import { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { 
  useModelOptions,
  useYearOptions,
  useVinLookup,
  useAutoFill,
  useValidation
} from "./vehicle-details";
import { getVehicleData } from "@/services/vehicleDataService";

export const useVehicleDetailsSection = (form: UseFormReturn<CarListingFormData>) => {
  // Watch make field to update models when it changes
  const make = form.watch("make");
  
  // Use the model options hook
  const { isLoading, availableModels } = useModelOptions(make);
  
  // Use the year options hook
  const yearOptions = useYearOptions();
  
  // Use the VIN lookup hook
  const { 
    isLoading: isLookupLoading, 
    storedVehicleData,
    handleVinLookup 
  } = useVinLookup(form);
  
  // Use the auto-fill hook
  const { handleAutoFill, isAutoFilling } = useAutoFill(form);
  
  // Use the validation hook
  const { validateVehicleDetails } = useValidation(form);
  
  // Load stored vehicle data if available
  useEffect(() => {
    const data = getVehicleData();
    if (data) {
      console.log('Loaded stored vehicle data:', data);
    }
  }, []);
  
  return {
    isLoading: isLoading || isLookupLoading || isAutoFilling,
    availableModels,
    yearOptions,
    validateVehicleDetails,
    handleVinLookup,
    handleAutoFill,
    storedVehicleData
  };
};
