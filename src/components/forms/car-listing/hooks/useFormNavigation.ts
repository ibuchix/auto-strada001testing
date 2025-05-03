
/**
 * useFormNavigation Hook
 * Created: 2025-07-12
 */

import { useState, useCallback } from "react";
import { UseFormReturn, FieldError } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";

// Define field mappings for steps
export const STEP_FIELD_MAPPINGS: Record<string, string[]> = {
  'car-details': ['make', 'model', 'year', 'mileage', 'vin', 'transmission'],
  'price': ['price', 'reserve_price'],
  'description': ['sellerNotes'],
  'additional-info': ['seatMaterial', 'numberOfKeys', 'isRegisteredInPoland', 'hasWarningLights'],
  'condition': ['hasServiceHistory'],
  'damage': ['isDamaged', 'damageReports'],
  'service-history': ['serviceHistoryType', 'serviceHistoryFiles'],
  'photos': ['uploadedPhotos', 'vehiclePhotos', 'frontView', 'rearView', 'driverSide', 'passengerSide', 'dashboard', 'interiorFront', 'interiorRear'],
  'rim-photos': ['rimPhotos'],
  'damage-photos': ['damagePhotos'],
  'documents': ['serviceHistoryFiles']
};

// Create a type for step errors
type StepErrorRecord = Record<string, any>;

export const useFormNavigation = (
  form: UseFormReturn<CarListingFormData>
) => {
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = 5; // Default value, should be replaced with actual step count
  
  // Go to next step
  const goToNextStep = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, totalSteps]);
  
  // Go to previous step
  const goToPrevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);
  
  // Go to specific step
  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < totalSteps) {
      setCurrentStep(step);
    }
  }, [totalSteps]);
  
  // Check if current step has errors
  const hasStepErrors = useCallback(() => {
    const errors = form.formState.errors;
    const currentStepFields = getCurrentStepFields();
    
    return currentStepFields.some(field => {
      const fieldError = errors[field as keyof typeof errors];
      return fieldError !== undefined;
    });
  }, [currentStep, form.formState.errors]);
  
  // Get current step fields
  const getCurrentStepFields = useCallback(() => {
    // This is a simplified version - actual implementation would depend on your step structure
    const steps = [
      ['make', 'model', 'year'],
      ['price', 'reserve_price'],
      ['sellerNotes'],
      ['photos'],
      ['documents']
    ];
    
    return steps[currentStep] || [];
  }, [currentStep]);
  
  // Get errors for current step
  const getCurrentStepErrors = useCallback(() => {
    const errors = form.formState.errors;
    const currentStepFields = getCurrentStepFields();
    
    return Object.entries(errors).filter(([field]) => 
      currentStepFields.includes(field)
    ).reduce((acc, [field, error]) => {
      acc[field] = error as any;
      return acc;
    }, {} as StepErrorRecord);
  }, [currentStep, form.formState.errors, getCurrentStepFields]);

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
