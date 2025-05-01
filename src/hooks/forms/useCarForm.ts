
/**
 * Changes made:
 * - Created consistent car form hook with React Hook Form integration
 * - Added form state persistence with localStorage
 * - Enhanced validation handling with detailed error reporting
 * - Added optimized submission handling with loading state management
 * - Fixed TypeScript error with setValue for transmission field
 * - 2028-11-14: Fixed TypeScript typing for extended form return type
 * - 2025-11-29: Fixed schema type compatibility with CarListingFormData
 * - 2025-12-01: Updated form typing to match schema output types
 * - 2025-05-28: Fixed valuation data loading issues and improved debugging
 */

import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useFormWithValidation } from "./useFormWithValidation";
import { CarListingFormData } from "@/types/forms";
import { toast } from "sonner";
import { getInitialFormValues } from "@/components/forms/car-listing/hooks/useFormDefaults";
import { extendedCarSchema, ExtendedCarSchema } from "@/utils/validation/carSchema";
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
  
  // Set up the form with validation - using the schema's output type for compatibility
  const form = useFormWithValidation<ExtendedCarSchema>({
    schema: extendedCarSchema,
    defaultValues: initialValues as any,
    formOptions: {
      mode: 'onBlur'
    },
    persistenceOptions: {
      key: `car_form_${userId}`,
      shouldPersist: true,
      excludeFields: ['uploadedPhotos'] // Don't persist large data in localStorage
    },
    onSubmit: async (data) => {
      try {
        // Ensure seller_id is set
        data.seller_id = userId;
        
        // Submit the car listing
        const result = await submitCarListing(data as CarListingFormData, userId, draftId);
        
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
  
  // Debug log when form is created
  useEffect(() => {
    console.log("useCarForm: Form initialized with userId:", userId);
  }, [userId]);
  
  // Load initial data from valuation if available
  const loadInitialData = useCallback(() => {
    console.log("useCarForm: loadInitialData called");
    
    try {
      // Get valuation data from local storage
      const valuationDataString = localStorage.getItem('valuationData');
      console.log("useCarForm: valuationDataString from localStorage:", 
        valuationDataString ? `${valuationDataString.substring(0, 50)}...` : "null");
      
      if (!valuationDataString) {
        console.log("useCarForm: No valuation data in localStorage");
        return;
      }
      
      let valuationData;
      try {
        valuationData = JSON.parse(valuationDataString);
        console.log("useCarForm: Parsed valuation data successfully:", {
          make: valuationData?.make,
          model: valuationData?.model,
          year: valuationData?.year,
          vin: valuationData?.vin,
          mileage: valuationData?.mileage
        });
      } catch (parseError) {
        console.error("useCarForm: Error parsing valuation data:", parseError);
        return;
      }
      
      if (!valuationData) {
        console.log("useCarForm: Parsed data is null/undefined");
        return;
      }
      
      // Apply valuation data to the form - setting as any to bypass type checking
      // for fields not explicitly declared in the schema
      console.log("useCarForm: Setting form values from valuation data");
      
      if (valuationData.make) {
        console.log("useCarForm: Setting make:", valuationData.make);
        form.setValue('make', valuationData.make);
      }
      
      if (valuationData.model) {
        console.log("useCarForm: Setting model:", valuationData.model);
        form.setValue('model', valuationData.model);
      }
      
      if (valuationData.year) {
        console.log("useCarForm: Setting year:", valuationData.year);
        form.setValue('year', valuationData.year);
      }
      
      if (valuationData.vin) {
        console.log("useCarForm: Setting vin:", valuationData.vin);
        form.setValue('vin', valuationData.vin);
      }
      
      // Get mileage from valuationData first, then localStorage if needed
      let mileage = valuationData.mileage;
      if (!mileage) {
        const tempMileage = localStorage.getItem('tempMileage');
        if (tempMileage) {
          mileage = parseInt(tempMileage);
          console.log("useCarForm: Using mileage from tempMileage:", mileage);
        }
      } else {
        console.log("useCarForm: Using mileage from valuationData:", mileage);
      }
      
      if (mileage) {
        form.setValue('mileage', mileage);
      }
      
      // Get transmission/gearbox from localStorage if available
      const gearbox = valuationData.gearbox || valuationData.transmission;
      const tempGearbox = gearbox || localStorage.getItem('tempGearbox') as "manual" | "automatic" | null;
      
      if (tempGearbox) {
        console.log("useCarForm: Setting transmission:", tempGearbox);
        form.setValue('transmission', tempGearbox);
      }
      
      // Verify data was set
      const currentValues = form.getValues();
      console.log("useCarForm: Current form values after initialization:", {
        make: currentValues.make,
        model: currentValues.model,
        year: currentValues.year,
        vin: currentValues.vin,
        mileage: currentValues.mileage,
        transmission: currentValues.transmission
      });
    } catch (error) {
      console.error('useCarForm: Error loading initial data:', error);
    }
  }, [form]);
  
  // Form reset handler
  const handleReset = useCallback(() => {
    console.log("useCarForm: handleReset called");
    form.reset(getInitialFormValues() as any);
  }, [form]);

  return {
    ...form,
    loadInitialData,
    handleReset
  };
}
