
/**
 * Form controller hook
 * Created: 2025-07-12
 * Updated: 2025-07-13 - Removed Next.js dependencies and fixed type issues
 */

import { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { CarListingFormData } from "@/types/forms";
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { FormStep } from '../types';

// Define the default values
export const DEFAULT_CAR_FEATURES = {
  airConditioning: false,
  bluetooth: false,
  cruiseControl: false,
  electricWindows: false,
  heatedSeats: false,
  leatherSeats: false,
  navigationSystem: false,
  parkingSensors: false,
  powerSteering: false
};

interface UseFormControllerProps {
  form: UseFormReturn<CarListingFormData>;
  currentStep: number;
}

export const useFormController = ({ form, currentStep }: UseFormControllerProps) => {
  const navigate = useNavigate();
  const [isDirty, setIsDirty] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // Watch for form changes to set dirty state
  useEffect(() => {
    const subscription = form.watch(() => {
      setIsDirty(true);
    });
    
    return () => subscription.unsubscribe();
  }, [form]);
  
  // Reset the dirty state
  const resetDirtyState = () => {
    setIsDirty(false);
  };
  
  // Validate the current step
  const validateCurrentStep = async (step: number = currentStep): Promise<boolean> => {
    try {
      // Get fields for this step
      const stepFields = getStepFields(step);
      
      // Validate only the fields for this step
      const isValid = await form.trigger(stepFields as any);
      
      if (!isValid) {
        setValidationError("Please fix the errors before proceeding");
        return false;
      }
      
      setValidationError(null);
      return true;
    } catch (error) {
      console.error("Error validating step:", error);
      setValidationError("An unexpected error occurred during validation");
      return false;
    }
  };
  
  // Helper to get field names for a specific step
  const getStepFields = (step: number): string[] => {
    // This would be replaced with actual field mappings
    const STEP_FIELDS = [
      ["make", "model", "year", "mileage"], // Step 0
      ["price", "reserve_price"], // Step 1
      ["sellerNotes", "features"], // Step 2
      ["uploadedPhotos", "vehiclePhotos"], // Step 3
    ];
    
    return STEP_FIELDS[step] || [];
  };
  
  // Check if the current step is valid
  const isStepValid = async (): Promise<boolean> => {
    return validateCurrentStep();
  };
  
  return {
    isDirty,
    validationError,
    resetDirtyState,
    validateCurrentStep,
    isStepValid
  };
};
