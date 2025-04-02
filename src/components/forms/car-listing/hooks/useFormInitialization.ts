
/**
 * Changes made:
 * - 2028-11-12: Extracted form initialization logic from FormContent.tsx
 * - 2028-11-14: Fixed TypeScript error with loadInitialData property
 * - 2028-05-18: Fixed initialization state handling to prevent stuck loading state
 */

import { useState, useEffect, useCallback } from "react";
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
}

export const useFormInitialization = ({ form, stepNavigation }: UseFormInitializationProps) => {
  // Initialization state
  const [initState, setInitState] = useState<FormInitState>({
    isInitializing: true,
    hasInitializedHooks: false
  });

  // Initialize form with defaults
  const initializeForm = useCallback(async () => {
    try {
      console.log('Starting form initialization');
      setInitState(prev => ({ ...prev, isInitializing: true }));
      const defaults = await getFormDefaults();
      form.reset(defaults);
      
      // Try to load initial data if the method exists
      if (form.loadInitialData) {
        try {
          console.log('Calling loadInitialData method');
          form.loadInitialData();
        } catch (error) {
          console.error('Form initialization error:', error);
          toast.error('Failed to load initial form data', {
            description: 'Please refresh the page or try again later',
            action: {
              label: 'Retry',
              onClick: () => window.location.reload()
            }
          });
        }
      }
    } catch (error) {
      console.error("Failed to initialize form defaults:", error);
      toast.error("Failed to load form defaults");
    } finally {
      // Mark initialization as complete
      console.log('Form initialization complete, setting isInitializing to false');
      setInitState(prev => ({ ...prev, isInitializing: false, hasInitializedHooks: true }));
    }
  }, [form]);
  
  // Run initialization once
  useEffect(() => {
    console.log('Running form initialization effect');
    initializeForm();
    
    // Failsafe: ensure we exit loading state after timeout
    const safetyTimeout = setTimeout(() => {
      console.log('Safety timeout triggered for form initialization');
      setInitState(prev => {
        if (prev.isInitializing) {
          console.log('Form was still initializing after timeout, forcing to ready state');
          return { ...prev, isInitializing: false, hasInitializedHooks: true };
        }
        return prev;
      });
    }, 5000); // 5 second safety timeout
    
    return () => clearTimeout(safetyTimeout);
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
        console.error('Periodic save failed:', error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [form, stepNavigation.currentStep]);

  return {
    isInitializing: initState.isInitializing,
    hasInitializedHooks: initState.hasInitializedHooks
  };
};
