
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
 * - 2025-05-31: Added direct localStorage access and render prevention for reliable loading
 * - 2025-05-19: Fixed function call parameter mismatch for submitCarListing
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
  fromValuation?: boolean;
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
  onSubmitError,
  fromValuation = false
}: UseCarFormOptions): ExtendedFormReturn {
  const navigate = useNavigate();
  // Use ref to track initialization to prevent loops
  const initialDataLoadedRef = useRef(false);
  const forceDataLoadTimerRef = useRef<NodeJS.Timeout | null>(null);
  const componentId = useRef(Math.random().toString(36).substring(2, 8));
  
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
        
        // Submit the car listing - fixed parameter count
        const result = await submitCarListing(data as CarListingFormData, userId);
        
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
    console.log(`useCarForm[${componentId.current}]: Form initialized with userId:`, userId, {
      fromValuation,
      hasLoadedBefore: initialDataLoadedRef.current
    });
    
    // Set up a force data load timer - quicker this time
    if (!forceDataLoadTimerRef.current) {
      forceDataLoadTimerRef.current = setTimeout(() => {
        if (!initialDataLoadedRef.current) {
          console.log(`useCarForm[${componentId.current}]: Force data load timer triggered, calling loadInitialData`);
          initialDataLoadedRef.current = true; // Prevent further attempts
          
          // Try to load data as a last resort
          loadDataFromStorage(true);
        }
      }, 1500); // Quick timer for quicker loading
    }
    
    // If fromValuation is true, try to load data immediately
    if (fromValuation && !initialDataLoadedRef.current) {
      console.log(`useCarForm[${componentId.current}]: fromValuation is true, loading data immediately`);
      loadInitialData();
    }
    
    // Clean up timer on unmount
    return () => {
      if (forceDataLoadTimerRef.current) {
        clearTimeout(forceDataLoadTimerRef.current);
        forceDataLoadTimerRef.current = null;
      }
    };
  }, [userId, fromValuation]);
  
  // Helper function to load data from localStorage
  const loadDataFromStorage = useCallback((isEmergency = false) => {
    try {
      // Collect all possible data sources
      const storedValuationData = localStorage.getItem('valuationData');
      const tempMake = localStorage.getItem('tempMake');
      const tempModel = localStorage.getItem('tempModel');
      const tempYear = localStorage.getItem('tempYear');
      const tempVin = localStorage.getItem('tempVIN');
      const tempMileage = localStorage.getItem('tempMileage');
      const tempGearbox = localStorage.getItem('tempGearbox');
      
      // Try to parse the valuation data first
      let valuationData: any = null;
      if (storedValuationData) {
        try {
          valuationData = JSON.parse(storedValuationData);
          console.log(`useCarForm[${componentId.current}]: Successfully parsed valuation data from localStorage`);
        } catch (e) {
          console.error(`useCarForm[${componentId.current}]: Error parsing valuation data:`, e);
        }
      }
      
      // Apply the data to the form
      const updatedValues: Partial<ExtendedCarSchema> = {};
      
      // From valuation data object if available
      if (valuationData) {
        if (valuationData.make) updatedValues.make = valuationData.make;
        if (valuationData.model) updatedValues.model = valuationData.model; 
        if (valuationData.year) updatedValues.year = valuationData.year;
        if (valuationData.vin) updatedValues.vin = valuationData.vin;
        if (valuationData.mileage) updatedValues.mileage = valuationData.mileage;
        if (valuationData.transmission || valuationData.gearbox) {
          updatedValues.transmission = valuationData.transmission || valuationData.gearbox;
        }
      }
      
      // If not in valuation data, try individual items
      if (!updatedValues.make && tempMake) updatedValues.make = tempMake;
      if (!updatedValues.model && tempModel) updatedValues.model = tempModel;
      if (!updatedValues.year && tempYear) updatedValues.year = parseInt(tempYear);
      if (!updatedValues.vin && tempVin) updatedValues.vin = tempVin;
      if (!updatedValues.mileage && tempMileage) updatedValues.mileage = parseInt(tempMileage);
      if (!updatedValues.transmission && tempGearbox) updatedValues.transmission = tempGearbox as any;
      
      if (Object.keys(updatedValues).length > 0) {
        console.log(`useCarForm[${componentId.current}]: ${isEmergency ? 'EMERGENCY ' : ''}Applying values:`, updatedValues);
        form.reset({...form.getValues(), ...updatedValues});
        
        // Show toast for emergency loads only
        if (isEmergency) {
          toast.success("Vehicle data loaded", { 
            description: `${updatedValues.year || ''} ${updatedValues.make || ''} ${updatedValues.model || ''}`,
            duration: 3000
          });
        }
        
        return true;
      }
      
      return false;
    } catch (e) {
      console.error(`useCarForm[${componentId.current}]: Error in ${isEmergency ? 'emergency ' : ''}data load:`, e);
      return false;
    }
  }, [form]);
  
  // Load initial data from valuation if available - safely
  const loadInitialData = useCallback(() => {
    // Guard against multiple calls in the same render cycle
    if (initialDataLoadedRef.current) {
      console.log(`useCarForm[${componentId.current}]: loadInitialData already called, skipping`);
      return;
    }
    
    // Mark as loaded to prevent loops
    initialDataLoadedRef.current = true;
    
    console.log(`useCarForm[${componentId.current}]: loadInitialData called`);
    
    // Try to load data from localStorage
    const success = loadDataFromStorage();
    
    // If successfully loaded, show toast
    if (success) {
      // Verify data was set
      const currentValues = form.getValues();
      console.log(`useCarForm[${componentId.current}]: Current form values after initialization:`, {
        make: currentValues.make,
        model: currentValues.model,
        year: currentValues.year,
        vin: currentValues.vin,
        mileage: currentValues.mileage,
        transmission: currentValues.transmission
      });
      
      toast.success("Vehicle data loaded", {
        description: `${currentValues.year || ''} ${currentValues.make || ''} ${currentValues.model || ''}`,
        duration: 3000
      });
    } else {
      console.log(`useCarForm[${componentId.current}]: No data found to load`);
    }
  }, [form, loadDataFromStorage]);
  
  // Form reset handler
  const handleReset = useCallback(() => {
    console.log(`useCarForm[${componentId.current}]: handleReset called`);
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
