
/**
 * Hook to handle validation of vehicle details
 * 
 * Changes made:
 * - 2025-04-07: Created validation hook for vehicle details
 * - 2025-04-07: Added field validation with detailed error messages
 * - 2025-04-07: Implemented centralized validation for forms
 * - 2025-04-07: Added performance optimizations to prevent UI freezing
 * - 2025-04-07: Implemented debounced validation to avoid excessive validation calls
 */
import { useState, useRef, useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { toast } from "sonner";

export const useValidation = (form: UseFormReturn<CarListingFormData>) => {
  const [isValidating, setIsValidating] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Validate required fields for this section with debouncing
  const validateVehicleDetails = useCallback(() => {
    // Clear any existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Set validating state
    setIsValidating(true);
    
    // Use debounce to prevent excessive validation calls
    return new Promise<boolean>((resolve) => {
      debounceTimerRef.current = setTimeout(() => {
        try {
          const { make, model, year, mileage } = form.getValues();
          const requiredFields = { make, model, year, mileage };
          
          let isValid = true;
          
          // Check each required field
          Object.entries(requiredFields).forEach(([field, value]) => {
            if (!value) {
              form.setError(field as any, {
                type: 'required',
                message: `${field.charAt(0).toUpperCase() + field.slice(1)} is required`
              });
              isValid = false;
            }
          });
          
          if (!isValid) {
            toast.error('Please fill in all required vehicle details');
          }
          
          setIsValidating(false);
          resolve(isValid);
        } catch (error) {
          console.error('Validation error:', error);
          setIsValidating(false);
          resolve(false);
        }
      }, 50); // Small delay for debouncing
    });
  }, [form]);
  
  return {
    validateVehicleDetails,
    isValidating
  };
};
