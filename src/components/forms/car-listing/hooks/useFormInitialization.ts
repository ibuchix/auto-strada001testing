
/**
 * Changes made:
 * - 2028-11-12: Extracted form initialization logic from FormContent.tsx
 * - 2028-11-14: Fixed TypeScript error with loadInitialData property
 * - 2028-05-18: Fixed initialization state handling to prevent stuck loading state
 * - 2025-05-28: Added enhanced debugging and fixed issues with valuation data
 * - 2025-05-30: Added force initialization mechanisms to prevent stuck states
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { getFormDefaults } from "./useFormDefaults";
import { toast } from "sonner";
import { saveToCache, CACHE_KEYS } from "@/services/offlineCacheService";

// Extended type to include our custom properties
interface ExtendedFormReturn extends UseFormReturn<CarListingFormData> {
  loadInitialData?: () => void;
  handleReset?: () => void;
}

interface UseFormInitializationProps {
  form: ExtendedFormReturn;
  stepNavigation: {
    currentStep: number;
  };
}

interface FormInitState {
  isInitializing: boolean;
  hasInitializedHooks: boolean;
  initAttempts: number;
}

export const useFormInitialization = ({ form, stepNavigation }: UseFormInitializationProps) => {
  // Initialization state
  const [initState, setInitState] = useState<FormInitState>({
    isInitializing: true,
    hasInitializedHooks: false,
    initAttempts: 0
  });
  
  // Use ref to prevent repeated initialization
  const initializingRef = useRef(false);
  const forceInitTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize form with defaults
  const initializeForm = useCallback(async () => {
    // Prevent multiple initializations simultaneously
    if (initializingRef.current) {
      console.log('FormInitialization: Already initializing, skipping');
      return;
    }
    
    try {
      initializingRef.current = true;
      
      console.log('FormInitialization: Starting form initialization (attempt #' + (initState.initAttempts + 1) + ')');
      setInitState(prev => ({ 
        ...prev, 
        isInitializing: true,
        initAttempts: prev.initAttempts + 1 
      }));
      
      // Set up a force initialize timer
      if (!forceInitTimeoutRef.current) {
        forceInitTimeoutRef.current = setTimeout(() => {
          console.log('FormInitialization: Force initialization timer triggered');
          setInitState({
            isInitializing: false,
            hasInitializedHooks: true,
            initAttempts: initState.initAttempts + 1
          });
        }, 4000);
      }
      
      const defaults = await getFormDefaults();
      console.log('FormInitialization: Got form defaults', {
        hasDefaults: !!defaults,
        makeDefault: defaults?.make,
        modelDefault: defaults?.model
      });
      
      form.reset(defaults);
      
      // Try to load initial data if the method exists
      if (form.loadInitialData) {
        try {
          console.log('FormInitialization: Calling loadInitialData method');
          form.loadInitialData();
          
          // Verify data was loaded
          const values = form.getValues();
          console.log('FormInitialization: Data loaded into form', {
            make: values.make,
            model: values.model,
            year: values.year,
            vin: values.vin,
            mileage: values.mileage
          });
        } catch (error) {
          console.error('FormInitialization: Form initialization error:', error);
          toast.error('Failed to load initial form data', {
            description: 'Please refresh the page or try again later',
            action: {
              label: 'Retry',
              onClick: () => window.location.reload()
            }
          });
        }
      } else {
        console.warn('FormInitialization: No loadInitialData method found on form');
      }
    } catch (error) {
      console.error("FormInitialization: Failed to initialize form defaults:", error);
      toast.error("Failed to load form defaults");
    } finally {
      // Mark initialization as complete
      console.log('FormInitialization: Initialization complete, setting isInitializing to false');
      
      // Clear force init timeout if it exists
      if (forceInitTimeoutRef.current) {
        clearTimeout(forceInitTimeoutRef.current);
        forceInitTimeoutRef.current = null;
      }
      
      setInitState(prev => ({ 
        ...prev, 
        isInitializing: false, 
        hasInitializedHooks: true 
      }));
      
      // Reset the initializing lock
      initializingRef.current = false;
    }
  }, [form, initState.initAttempts]);
  
  // Run initialization once
  useEffect(() => {
    console.log('FormInitialization: Running form initialization effect');
    initializeForm();
    
    // Failsafe: ensure we exit loading state after timeout
    const safetyTimeout = setTimeout(() => {
      console.log('FormInitialization: Safety timeout triggered after 5 seconds');
      setInitState(prev => {
        if (prev.isInitializing) {
          console.log('FormInitialization: Form was still initializing after timeout, forcing to ready state');
          return { ...prev, isInitializing: false, hasInitializedHooks: true };
        }
        return prev;
      });
      
      // Also reset the initializing lock
      initializingRef.current = false;
    }, 5000); // 5 second safety timeout
    
    return () => {
      clearTimeout(safetyTimeout);
      if (forceInitTimeoutRef.current) {
        clearTimeout(forceInitTimeoutRef.current);
      }
    };
  }, [initializeForm]);
  
  // Periodic saving of key form values
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const formValues = form.getValues();
        saveToCache(CACHE_KEYS.TEMP_MILEAGE, formValues.mileage?.toString() || '');
        saveToCache(CACHE_KEYS.TEMP_VIN, formValues.vin || '');
        saveToCache(CACHE_KEYS.FORM_STEP, stepNavigation.currentStep.toString());
      } catch (error) {
        console.error('FormInitialization: Periodic save failed:', error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [form, stepNavigation.currentStep]);

  return {
    isInitializing: initState.isInitializing,
    hasInitializedHooks: initState.hasInitializedHooks,
    initAttempts: initState.initAttempts
  };
};
