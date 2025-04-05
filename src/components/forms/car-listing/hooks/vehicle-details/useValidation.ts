
/**
 * Hook to handle validation of vehicle details
 */
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { toast } from "sonner";

export const useValidation = (form: UseFormReturn<CarListingFormData>) => {
  // Validate required fields for this section
  const validateVehicleDetails = () => {
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
    
    return isValid;
  };
  
  return {
    validateVehicleDetails
  };
};
