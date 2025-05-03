
/**
 * useStepNavigation Hook
 * Created: 2025-06-16
 * Updated: 2025-06-18 - Added STEP_FIELD_MAPPINGS export
 * Updated: 2025-06-19 - Fixed export declaration
 * Updated: 2025-06-22 - Fixed FieldError type handling
 * 
 * Hook for managing navigation between form steps
 */

import { useState } from "react";
import { UseFormReturn, FieldError, FieldErrorsImpl } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { formSteps } from "../constants/formSteps";

// Export the field mappings for external use
export const STEP_FIELD_MAPPINGS = {
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

// Create a type for our error record
type StepErrorRecord = Record<string, any>;

export const useStepNavigation = (
  form: UseFormReturn<CarListingFormData>
) => {
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = formSteps.length;
  
  // Go to next step
  const goToNextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  // Go to previous step
  const goToPrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  // Go to specific step
  const goToStep = (step: number) => {
    if (step >= 0 && step < totalSteps) {
      setCurrentStep(step);
    }
  };
  
  // Check if current step has validation errors
  const hasStepErrors = () => {
    const errors = form.formState.errors;
    const currentStepFields = formSteps[currentStep].sections.flatMap(
      section => getFieldsForSection(section)
    );
    
    // Check if any errors exist on fields in the current step
    return currentStepFields.some(field => {
      // Safely check for errors, ensuring the field exists in errors
      const fieldError = errors[field as keyof typeof errors];
      return fieldError !== undefined;
    });
  };
  
  // Get all errors for the current step
  const getCurrentStepErrors = () => {
    const errors = form.formState.errors;
    const currentStepFields = formSteps[currentStep].sections.flatMap(
      section => getFieldsForSection(section)
    );
    
    // Filter errors to only include those on the current step's fields
    return Object.entries(errors).filter(([field]) => 
      currentStepFields.includes(field)
    ).reduce((acc, [field, error]) => {
      // We're just capturing the fact that there is an error, not using the specific type
      acc[field] = error as any;
      return acc;
    }, {} as StepErrorRecord);
  };
  
  // Helper function to map sections to field names
  const getFieldsForSection = (section: string): string[] => {
    return STEP_FIELD_MAPPINGS[section as keyof typeof STEP_FIELD_MAPPINGS] || [];
  };

  return {
    currentStep,
    totalSteps,
    goToNextStep,
    goToPrevStep,
    goToStep,
    hasStepErrors,
    getCurrentStepErrors,
  };
};
