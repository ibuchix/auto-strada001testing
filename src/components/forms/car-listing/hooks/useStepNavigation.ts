
/**
 * useStepNavigation Hook
 * Created: 2025-06-16
 * 
 * Hook for managing navigation between form steps
 */

import { useState } from "react";
import { UseFormReturn, FieldError } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { formSteps } from "../constants/formSteps";

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
      acc[field] = error;
      return acc;
    }, {} as Record<string, FieldError>);
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

// Helper function to map sections to field names
function getFieldsForSection(section: string): string[] {
  switch (section) {
    case 'car-details':
      return ['make', 'model', 'year', 'mileage', 'vin', 'transmission'];
    case 'price':
      return ['price', 'reserve_price'];
    case 'description':
      return ['sellerNotes'];
    case 'condition':
      return ['hasServiceHistory'];
    case 'damage':
      return ['isDamaged', 'damageReports'];
    case 'service-history':
      return ['serviceHistoryType', 'serviceHistoryFiles'];
    case 'photos':
      return ['uploadedPhotos'];
    case 'rim-photos':
      return ['rimPhotos'];
    case 'damage-photos':
      return ['damagePhotos'];
    case 'documents':
      return ['serviceHistoryFiles'];
    default:
      return [];
  }
}
