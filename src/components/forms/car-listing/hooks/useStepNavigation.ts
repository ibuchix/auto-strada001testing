
/**
 * Step Navigation Hook
 * Created: 2025-05-03
 * Updated: 2025-06-15 - Added STEP_FIELD_MAPPINGS
 * 
 * Hook for managing multi-step form navigation
 */

import { useState, useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { formSteps } from "../constants/formSteps";

// Map each step to relevant form fields for validation
export const STEP_FIELD_MAPPINGS: Record<string, string[]> = {
  'basic-info': ['make', 'model', 'year', 'mileage', 'vin', 'transmission', 'price'],
  'condition': ['isDamaged', 'hasServiceHistory', 'hasFinance', 'hasPrivatePlate'],
  'photos': ['uploadedPhotos', 'photoIds', 'rimPhotos', 'requiredPhotosComplete']
};

export const useStepNavigation = (form: UseFormReturn<CarListingFormData>) => {
  const [currentStep, setCurrentStep] = useState(0);
  
  const totalSteps = formSteps.length;
  
  // Check if current step has errors
  const hasStepErrors = useCallback(() => {
    const currentStepId = formSteps[currentStep]?.id;
    if (!currentStepId) return false;
    
    const formState = form.formState;
    const errors = formState.errors;
    
    // Check errors based on step
    switch (currentStepId) {
      case 'basic-info':
        return !!(
          errors.make || 
          errors.model || 
          errors.year || 
          errors.mileage || 
          errors.vin || 
          errors.transmission
        );
      case 'condition':
        return !!(
          errors.hasServiceHistory ||
          errors.hasFinance ||
          errors.hasPrivatePlate ||
          errors.isDamaged
        );
      case 'photos':
        return !!(
          errors.photoIds || 
          errors.requiredPhotosComplete
        );
      default:
        return false;
    }
  }, [currentStep, form.formState]);
  
  // Get errors for current step
  const getCurrentStepErrors = useCallback(() => {
    const currentStepId = formSteps[currentStep]?.id;
    if (!currentStepId) return [];
    
    const formState = form.formState;
    const errors = formState.errors;
    const errorMessages: string[] = [];
    
    // Collect errors based on step
    switch (currentStepId) {
      case 'basic-info':
        if (errors.make) errorMessages.push('Make is required');
        if (errors.model) errorMessages.push('Model is required');
        if (errors.year) errorMessages.push('Year is required');
        if (errors.mileage) errorMessages.push('Mileage is required');
        if (errors.vin) errorMessages.push('VIN is required');
        if (errors.transmission) errorMessages.push('Transmission is required');
        break;
      case 'condition':
        // Not many validation errors possible here as these are boolean fields
        break;
      case 'photos':
        if (errors.photoIds) errorMessages.push('Required photos missing');
        if (errors.requiredPhotosComplete) errorMessages.push('All required photos must be uploaded');
        break;
      default:
        break;
    }
    
    return errorMessages;
  }, [currentStep, form.formState]);
  
  // Go to next step
  const goToNextStep = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, totalSteps]);
  
  // Go to previous step
  const goToPrevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);
  
  // Go to specific step
  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < totalSteps) {
      setCurrentStep(step);
    }
  }, [totalSteps]);
  
  return {
    currentStep,
    totalSteps,
    goToNextStep,
    goToPrevStep,
    goToStep,
    hasStepErrors,
    getCurrentStepErrors
  };
};
