
/**
 * Changes made:
 * - 2028-11-12: Extracted form initialization logic from FormContent.tsx
 */

import { useState, useEffect, useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { getFormDefaults } from "./useFormDefaults";
import { toast } from "sonner";
import { saveToCache, CACHE_KEYS } from "@/services/offlineCacheService";

interface UseFormInitializationProps {
  form: UseFormReturn<CarListingFormData>;
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
      setInitState(prev => ({ ...prev, isInitializing: true }));
      const defaults = await getFormDefaults();
      form.reset(defaults);
      
      // Try to load initial data
      try {
        form.loadInitialData && form.loadInitialData();
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
    } catch (error) {
      console.error("Failed to initialize form defaults:", error);
      toast.error("Failed to load form defaults");
    } finally {
      // Mark initialization as complete
      setInitState(prev => ({ ...prev, isInitializing: false, hasInitializedHooks: true }));
    }
  }, [form]);
  
  // Run initialization once
  useEffect(() => {
    initializeForm();
  }, [initializeForm]);

  // Periodic saving of key form values
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const formValues = form.getValues();
        saveToCache(CACHE_KEYS.TEMP_MILEAGE, formValues.mileage?.toString() || '');
        saveToCache(CACHE_KEYS.TEMP_VIN, formValues.vin || '');
        saveToCache(CACHE_KEYS.FORM_STEP, stepNavigation.currentStep.toString());
        
        console.log('Periodic save completed', new Date().toISOString());
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
