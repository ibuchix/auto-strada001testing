
/**
 * useFormNavigation Hook
 * Created: 2025-07-12
 * Updated: 2025-07-23 - Fixed type definitions and improved step navigation logic
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
  'service-history': ['serviceHistory', 'serviceHistoryType'],
  'photos': ['uploadedPhotos', 'vehiclePhotos', 'frontView', 'rearView', 'driverSide', 'passengerSide', 'dashboard', 'interiorFront', 'interiorRear'],
  'rim-photos': ['rimPhotos'],
  'damage-photos': ['damagePhotos'],
  'documents': ['serviceHistory']
};

// Create a type for step errors
type StepErrorRecord = Record<string, any>;

// Define step structure
export interface FormStep {
  id: string;
  title: string;
  fields: string[];
  isRequired?: boolean;
  isConditional?: boolean;
  condition?: (data: CarListingFormData) => boolean;
}

// List of form steps
export const FORM_STEPS: FormStep[] = [
  {
    id: 'vehicle-details',
    title: 'Vehicle Details',
    fields: ['make', 'model', 'year', 'mileage', 'vin', 'transmission'],
    isRequired: true
  },
  {
    id: 'pricing',
    title: 'Pricing',
    fields: ['price', 'reserve_price'],
    isRequired: true
  },
  {
    id: 'condition',
    title: 'Condition',
    fields: ['hasServiceHistory', 'serviceHistory', 'serviceHistoryType'],
    isRequired: true
  },
  {
    id: 'damage',
    title: 'Damage Information',
    fields: ['isDamaged', 'damageReports'],
    isRequired: true
  },
  {
    id: 'photos',
    title: 'Vehicle Photos',
    fields: ['uploadedPhotos', 'vehiclePhotos', 'frontView', 'rearView', 'driverSide', 'passengerSide', 'dashboard', 'interiorFront', 'interiorRear'],
    isRequired: true
  },
  {
    id: 'additional-info',
    title: 'Additional Information',
    fields: ['seatMaterial', 'numberOfKeys', 'isRegisteredInPoland', 'hasWarningLights'],
    isRequired: false
  },
  {
    id: 'seller-notes',
    title: 'Seller Notes',
    fields: ['sellerNotes'],
    isRequired: false
  }
];

export const useFormNavigation = (
  form: UseFormReturn<CarListingFormData>
) => {
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = FORM_STEPS.length;
  
  // Find available steps based on form data
  const getAvailableSteps = useCallback(() => {
    const formData = form.getValues();
    
    return FORM_STEPS.filter(step => {
      if (step.isConditional && step.condition) {
        return step.condition(formData);
      }
      return true;
    });
  }, [form]);
  
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
    const availableSteps = getAvailableSteps();
    if (currentStep < availableSteps.length) {
      return availableSteps[currentStep].fields || [];
    }
    return [];
  }, [currentStep, getAvailableSteps]);
  
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
    getCurrentStepErrors,
    getCurrentStepFields,
    getAvailableSteps
  };
};
