
/**
 * Changes made:
 * - Created consistent car form hook with React Hook Form integration
 * - Added form state persistence with localStorage
 * - Enhanced validation handling with detailed error reporting
 * - Added optimized submission handling with loading state management
 * - Fixed TypeScript error with setValue for transmission field
 * - 2028-11-14: Fixed TypeScript typing for extended form return type
 */

import { useCallback } from "react";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { useFormWithValidation } from "./useFormWithValidation";
import { CarListingFormData } from "@/types/forms";
import { toast } from "sonner";
import { getInitialFormValues } from "@/components/forms/car-listing/hooks/useFormDefaults";
import { carSchema } from "@/utils/validation/carSchema";
import { submitCarListing } from "@/components/forms/car-listing/submission/services/submissionService";

type UseCarFormOptions = {
  userId: string;
  draftId?: string;
  onSubmitSuccess?: (result: any) => void;
  onSubmitError?: (error: any) => void;
};

// Extended form return type with our custom methods
interface ExtendedFormReturn {
  loadInitialData: () => void;
  handleReset: () => void;
  [key: string]: any; // To allow spreading the remaining form properties
}

export function useCarForm({
  userId,
  draftId,
  onSubmitSuccess,
  onSubmitError
}: UseCarFormOptions): ExtendedFormReturn {
  const navigate = useNavigate();
  
  // Load initial form values
  const initialValues = getInitialFormValues();
  
  // Set up the form with validation
  const form = useFormWithValidation({
    schema: carSchema.partial(),
    defaultValues: initialValues,
    formOptions: {
      mode: 'onBlur'
    },
    persistenceOptions: {
      key: `car_form_${userId}`,
      shouldPersist: true,
      excludeFields: ['uploadedPhotos'] // Don't persist large data in localStorage
    },
    onSubmit: async (data: CarListingFormData) => {
      try {
        // Ensure seller_id is set
        data.seller_id = userId;
        
        // Submit the car listing
        const result = await submitCarListing(data, userId, draftId);
        
        toast.success("Car listing submitted successfully!");
        
        // Call success callback
        if (onSubmitSuccess) {
          onSubmitSuccess(result);
        }
        
        return result;
      } catch (error: any) {
        console.error("Error submitting car listing:", error);
        
        toast.error(error.message || "Failed to submit car listing", {
          description: error.description || "Please try again later"
        });
        
        // Call error callback
        if (onSubmitError) {
          onSubmitError(error);
        }
        
        throw error;
      }
    }
  });
  
  // Load initial data from valuation if available
  const loadInitialData = useCallback(() => {
    try {
      // Get valuation data from local storage
      const valuationDataString = localStorage.getItem('valuationData');
      if (!valuationDataString) return;
      
      const valuationData = JSON.parse(valuationDataString);
      if (!valuationData) return;
      
      // Apply valuation data to the form - setting as any to bypass type checking
      // for fields not explicitly declared in the schema
      if (valuationData.make) form.setValue('make' as any, valuationData.make);
      if (valuationData.model) form.setValue('model' as any, valuationData.model);
      if (valuationData.year) form.setValue('year' as any, valuationData.year);
      if (valuationData.vin) form.setValue('vin' as any, valuationData.vin);
      
      // Get mileage from localStorage if available
      const tempMileage = localStorage.getItem('tempMileage');
      if (tempMileage) {
        form.setValue('mileage' as any, parseInt(tempMileage));
      }
      
      // Get transmission/gearbox from localStorage if available
      const tempGearbox = localStorage.getItem('tempGearbox') as "manual" | "automatic" | null;
      if (tempGearbox) {
        form.setValue('transmission' as any, tempGearbox);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  }, [form]);
  
  // Form reset handler
  const handleReset = useCallback(() => {
    form.reset(getInitialFormValues());
  }, [form]);

  return {
    ...form,
    loadInitialData,
    handleReset
  };
}
