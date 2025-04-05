
/**
 * Changes made:
 * - Completely refactored into smaller, more focused hooks
 * - Each functionality is now in its own dedicated hook
 * - Improved organization and maintainability
 * - Enhanced error handling for VIN validation and auto-fill
 * - Improved typing throughout
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
import { getStoredValidationData } from "@/services/supabase/valuation/vinValidationService";

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
  const { handleAutoFill } = useAutoFill(form);
  
  // Use the validation hook
  const { validateVehicleDetails } = useValidation(form);
  
  // Load stored validation data if available
  useEffect(() => {
    const data = getStoredValidationData();
    if (data) {
      console.log('Loaded stored vehicle data:', data);
    }
  }, []);
  
  return {
    isLoading: isLoading || isLookupLoading,
    availableModels,
    yearOptions,
    validateVehicleDetails,
    handleVinLookup,
    handleAutoFill,
    storedVehicleData
  };
};
