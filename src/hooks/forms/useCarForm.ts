
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
 * - 2025-05-29: Fixed infinite re-render by adding initialization guards
 * - 2025-05-30: Added force loading mechanisms to prevent stuck states
 */

import { useCallback, useEffect, useRef } from "react";
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
  // Use ref to track initialization to prevent loops
  const initialDataLoadedRef = useRef(false);
  const forceDataLoadTimerRef = useRef<NodeJS.Timeout | null>(null);
  
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
  
  // Debug log when form is created - only once
  useEffect(() => {
    console.log("useCarForm: Form initialized with userId:", userId);
    
    // Set up a force data load timer
    if (!forceDataLoadTimerRef.current) {
      forceDataLoadTimerRef.current = setTimeout(() => {
        if (!initialDataLoadedRef.current) {
          console.log("useCarForm: Force data load timer triggered, calling loadInitialData");
          initialDataLoadedRef.current = true; // Prevent further attempts
          
          // Try to load data as a last resort
          try {
            const storedValuationData = localStorage.getItem('valuationData');
            if (storedValuationData) {
              const parsedData = JSON.parse(storedValuationData);
              
              // Apply directly without using loadInitialData
              const updatedValues: Partial<ExtendedCarSchema> = {};
              
              if (parsedData.make) updatedValues.make = parsedData.make;
              if (parsedData.model) updatedValues.model = parsedData.model; 
              if (parsedData.year) updatedValues.year = parsedData.year;
              if (parsedData.vin) updatedValues.vin = parsedData.vin;
              if (parsedData.mileage) updatedValues.mileage = parsedData.mileage;
              
              console.log("useCarForm: Emergency applying values:", updatedValues);
              form.reset({...form.getValues(), ...updatedValues});
              
              toast.info("Form data restored", { 
                duration: 3000
              });
            }
          } catch (e) {
            console.error("useCarForm: Error in emergency data load:", e);
          }
        }
      }, 6000); // 6 second safety timer
    }
    
    // Clean up timer on unmount
    return () => {
      if (forceDataLoadTimerRef.current) {
        clearTimeout(forceDataLoadTimerRef.current);
        forceDataLoadTimerRef.current = null;
      }
    };
  }, [userId]);
  
  // Load initial data from valuation if available - safely
  const loadInitialData = useCallback(() => {
    // Guard against multiple calls in the same render cycle
    if (initialDataLoadedRef.current) {
      console.log("useCarForm: loadInitialData already called, skipping");
      return;
    }
    
    // Mark as loaded to prevent loops
    initialDataLoadedRef.current = true;
    
    console.log("useCarForm: loadInitialData called");
    
    try {
      // Get valuation data from local storage
      const valuationDataString = localStorage.getItem('valuationData');
      console.log("useCarForm: valuationDataString from localStorage:", 
        valuationDataString ? `${valuationDataString.substring(0, 50)}...` : "null");
      
      if (!valuationDataString) {
        console.log("useCarForm: No valuation data in localStorage");
        // Try to get from tempVIN as a last resort
        const tempVin = localStorage.getItem('tempVIN');
        if (tempVin) {
          console.log("useCarForm: Found VIN in localStorage:", tempVin);
          form.setValue('vin', tempVin);
        }
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
      
      // Batch form updates to prevent re-renders
      const updatedValues: Partial<ExtendedCarSchema> = {};
      
      if (valuationData.make) {
        console.log("useCarForm: Setting make:", valuationData.make);
        updatedValues.make = valuationData.make;
      }
      
      if (valuationData.model) {
        console.log("useCarForm: Setting model:", valuationData.model);
        updatedValues.model = valuationData.model;
      }
      
      if (valuationData.year) {
        console.log("useCarForm: Setting year:", valuationData.year);
        updatedValues.year = valuationData.year;
      }
      
      if (valuationData.vin) {
        console.log("useCarForm: Setting vin:", valuationData.vin);
        updatedValues.vin = valuationData.vin;
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
        updatedValues.mileage = mileage;
      }
      
      // Get transmission/gearbox from localStorage if available
      const gearbox = valuationData.gearbox || valuationData.transmission;
      const tempGearbox = gearbox || localStorage.getItem('tempGearbox') as "manual" | "automatic" | null;
      
      if (tempGearbox) {
        console.log("useCarForm: Setting transmission:", tempGearbox);
        updatedValues.transmission = tempGearbox;
      }
      
      // Apply all updates at once
      if (Object.keys(updatedValues).length > 0) {
        form.reset({...form.getValues(), ...updatedValues});
        
        // Show success toast
        toast.success("Vehicle data loaded", {
          description: `${updatedValues.year || ''} ${updatedValues.make || ''} ${updatedValues.model || ''}`,
          duration: 2000
        });
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
    // Reset the initialization flag to allow re-initialization if needed
    initialDataLoadedRef.current = false;
  }, [form]);

  return {
    ...form,
    loadInitialData,
    handleReset
  };
}
