
/**
 * Changes made:
 * - Enhanced integration with vehicle data handling hooks
 * - Improved promise handling for auto-fill functionality
 * - Added better error reporting and validation
 * - 2025-04-07: Refactored to use optimized hooks and prevent UI freezing
 * - 2025-04-07: Added safeguards against memory leaks and infinite loops
 * - 2025-04-07: Improved error handling and user feedback
 */

import { useEffect, useRef } from "react";
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
import { useVehicleDataManager } from "./vehicle-details/useVehicleDataManager";

export const useVehicleDetailsSection = (form: UseFormReturn<CarListingFormData>) => {
  // Track whether this hook has been initialized
  const initializedRef = useRef(false);
  
  // Watch make field to update models when it changes
  const make = form.watch("make");
  
  // Use the vehicle data manager for centralized data handling
  const vehicleDataManager = useVehicleDataManager(form);
  
  // Use the model options hook
  const { isLoading, availableModels } = useModelOptions(make);
  
  // Use the year options hook
  const yearOptions = useYearOptions();
  
  // Use the VIN lookup hook with optimization
  const { 
    isLoading: isLookupLoading, 
    storedVehicleData,
    handleVinLookup 
  } = useVinLookup(form);
  
  // Use the auto-fill hook with optimization
  const { handleAutoFill, isAutoFilling } = useAutoFill(form);
  
  // Use the validation hook with optimization
  const { validateVehicleDetails, isValidating } = useValidation(form);
  
  // Load stored vehicle data if available - but only once, with cleanup
  useEffect(() => {
    // Mark as initialized to prevent double-initialization
    if (initializedRef.current) return;
    initializedRef.current = true;
    
    const startTime = performance.now();
    console.log('Initializing vehicle details section');
    
    // Use a short timeout to avoid blocking the initial render
    const timeoutId = setTimeout(() => {
      try {
        const data = getVehicleData();
        if (data) {
          console.log('Loaded stored vehicle data:', data);
        }
        
        const endTime = performance.now();
        console.log(`Vehicle details section initialized in ${(endTime - startTime).toFixed(2)}ms`);
      } catch (error) {
        console.error('Error loading vehicle data:', error);
      }
    }, 100);
    
    // Cleanup function to prevent memory leaks
    return () => {
      clearTimeout(timeoutId);
    };
  }, []);
  
  return {
    isLoading: isLoading || isLookupLoading || isAutoFilling || isValidating,
    availableModels,
    yearOptions,
    validateVehicleDetails,
    handleVinLookup,
    handleAutoFill,
    storedVehicleData,
    ...vehicleDataManager
  };
};
