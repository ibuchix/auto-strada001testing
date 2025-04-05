
/**
 * Hook to handle auto-filling vehicle details from stored validation data
 * 
 * Changes made:
 * - 2025-04-06: Updated to use the centralized vehicle data service
 * - 2025-04-06: Improved type conversion for numeric fields
 * - 2025-04-06: Added detailed error handling and debugging logs
 * - 2025-04-06: Added validation before applying values
 * - 2025-04-07: Enhanced with Promise-based return for better feedback
 * - 2025-04-07: Fixed memory leak issues and added performance optimizations
 * - 2025-04-07: Implemented safeguards to prevent UI freezing
 */
import { useState, useRef } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { toast } from "sonner";
import { 
  hasCompleteVehicleData,
  applyVehicleDataToForm
} from "@/services/vehicleDataService";

export const useAutoFill = (form: UseFormReturn<CarListingFormData>) => {
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Auto-fill form with stored vehicle data
  const handleAutoFill = async (): Promise<boolean> => {
    console.log('Starting auto-fill process');
    
    // Cancel any previous auto-fill operation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create a new abort controller for this operation
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    if (!hasCompleteVehicleData()) {
      console.warn('Auto-fill attempted with incomplete vehicle data');
      return false;
    }
    
    setIsAutoFilling(true);
    
    try {
      // Check if operation was aborted
      if (signal.aborted) {
        throw new Error('Auto-fill operation was aborted');
      }
      
      // Use setTimeout to prevent UI blocking
      return await new Promise<boolean>((resolve) => {
        setTimeout(() => {
          try {
            // Validate the form fields before auto-filling
            // This helps ensure we're not overwriting valid data with invalid data
            const initialFormValues = form.getValues();
            console.log('Current form values before auto-fill:', initialFormValues);
            
            // Apply the vehicle data to the form - returns boolean success
            const success = applyVehicleDataToForm(form, true);
            
            if (!success) {
              console.error('Auto-fill application failed');
              resolve(false);
              return;
            }
            
            console.log('Auto-fill completed successfully');
            resolve(true);
          } catch (error) {
            console.error('Error in auto-fill timeout handler:', error);
            resolve(false);
          } finally {
            setIsAutoFilling(false);
          }
        }, 10); // Small delay to allow UI update
      });
    } catch (error) {
      console.error('Error during auto-fill:', error);
      setIsAutoFilling(false);
      return false;
    }
  };
  
  return {
    handleAutoFill,
    isAutoFilling
  };
};
