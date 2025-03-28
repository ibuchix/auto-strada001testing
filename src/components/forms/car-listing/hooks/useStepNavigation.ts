
/**
 * Custom hook to handle form step navigation logic
 * - Centralizes navigation between form steps
 * - Handles validation before proceeding
 * - Manages step completion state
 */

import { useState, useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { toast } from "sonner";

// Define field mappings for each step (matching form structure)
export const STEP_FIELD_MAPPINGS: Record<string, Array<keyof CarListingFormData>> = {
  'personal-details': ['name', 'email', 'phone', 'address', 'city', 'postalCode'],
  'vehicle-status': ['make', 'model', 'year', 'mileage', 'condition', 'isDamaged'],
  'features': ['features', 'transmission', 'fuelType', 'bodyType', 'color'],
  'additional-info': ['purchaseDate', 'ownershipStatus', 'serviceHistory', 'seatMaterial', 'numberOfKeys'],
  'photos': ['uploadedPhotos', 'mainPhoto'],
  'notes': ['sellerNotes', 'priceExpectation'],
  'rims': ['frontLeftRimPhoto', 'frontRightRimPhoto', 'rearLeftRimPhoto', 'rearRightRimPhoto'],
  'service-history': ['serviceDocuments', 'lastServiceDate', 'serviceHistoryType']
};

interface UseStepNavigationProps {
  form: UseFormReturn<CarListingFormData>;
  totalSteps: number;
  initialStep?: number;
  saveProgress: () => Promise<void>;
  filteredSteps: Array<{
    id: string;
    validate?: (data: CarListingFormData) => boolean;
  }>;
}

interface StepNavigationState {
  currentStep: number;
  isNavigating: boolean;
  validationErrors: Record<string, string>;
  completedSteps: number[];
  stepValidationErrors: Record<string, boolean>;
}

export const useStepNavigation = ({
  form,
  totalSteps,
  initialStep = 0,
  saveProgress,
  filteredSteps
}: UseStepNavigationProps) => {
  const [state, setState] = useState<StepNavigationState>({
    currentStep: initialStep,
    isNavigating: false,
    validationErrors: {},
    completedSteps: [],
    stepValidationErrors: {}
  });
  
  // Validate the fields for the current step
  const validateStepFields = useCallback(async (stepId: string) => {
    const fieldsToValidate = STEP_FIELD_MAPPINGS[stepId] || [];
    if (fieldsToValidate.length === 0) return true;
    
    try {
      // Get current form values for validation
      const currentValues = form.getValues();
      
      // Use the validate function from formSteps if available
      const currentStepConfig = filteredSteps.find(step => step.id === stepId);
      if (currentStepConfig?.validate) {
        const isValid = currentStepConfig.validate(currentValues);
        
        if (!isValid) {
          setState(prev => ({
            ...prev,
            stepValidationErrors: {...prev.stepValidationErrors, [stepId]: true}
          }));
          return false;
        }
      }
      
      // Standard field validation
      const result = await form.trigger(fieldsToValidate as any[]);
      
      if (!result) {
        // Extract field errors for better messaging
        const newValidationErrors: Record<string, string> = {};
        fieldsToValidate.forEach(field => {
          const errorMessage = form.formState.errors[field]?.message;
          if (errorMessage && typeof errorMessage === 'string') {
            newValidationErrors[field] = errorMessage;
          }
        });
        
        setState(prev => ({
          ...prev,
          validationErrors: newValidationErrors,
          stepValidationErrors: {...prev.stepValidationErrors, [stepId]: true}
        }));
      } else {
        // Clear validation errors if validation passes
        setState(prev => {
          const updatedStepErrors = {...prev.stepValidationErrors};
          delete updatedStepErrors[stepId];
          
          // Mark step as completed
          let updatedCompletedSteps = [...prev.completedSteps];
          if (!updatedCompletedSteps.includes(prev.currentStep)) {
            updatedCompletedSteps = [...updatedCompletedSteps, prev.currentStep].sort((a, b) => a - b);
          }
          
          return {
            ...prev,
            validationErrors: {},
            stepValidationErrors: updatedStepErrors,
            completedSteps: updatedCompletedSteps
          };
        });
      }
      
      return result;
    } catch (error) {
      console.error('Validation error:', error);
      return false;
    }
  }, [form, filteredSteps]);

  // Handle navigation between steps
  const handleNavigation = useCallback(async (direction: 'previous' | 'next') => {
    if (state.isNavigating) return;

    setState(prev => ({...prev, isNavigating: true, validationErrors: {}}));
    const newStep = direction === 'next' ? state.currentStep + 1 : state.currentStep - 1;

    try {
      // Validate current step before proceeding to next step
      if (direction === 'next') {
        const currentStepId = filteredSteps[state.currentStep]?.id;
        const isValid = await validateStepFields(currentStepId);
        
        if (!isValid) {
          setState(prev => ({...prev, isNavigating: false}));
          
          // Get the errors from the form state
          const formErrors = form.formState.errors;
          const errorFields = Object.keys(formErrors);
          
          if (errorFields.length > 0) {
            // Show toast with specific field errors
            const firstErrorField = errorFields[0];
            const firstErrorMessage = formErrors[firstErrorField as keyof typeof formErrors]?.message;
            
            toast.error("Please complete all required fields", {
              description: typeof firstErrorMessage === 'string' 
                ? firstErrorMessage 
                : "Some information is missing or incorrect.",
              action: {
                label: "Review",
                onClick: () => {
                  // Focus on the first error field if possible
                  const element = document.getElementById(firstErrorField);
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    element.focus();
                  }
                }
              }
            });
          } else {
            toast.error("Please complete all required fields", {
              description: "There are missing or invalid fields on this page."
            });
          }
          return;
        }
      }

      // Save progress before navigation
      await saveProgress();
      setState(prev => ({...prev, currentStep: newStep, isNavigating: false}));
      
    } catch (error) {
      console.error('Navigation error:', error);
      toast.error('Navigation failed', {
        description: error instanceof Error ? error.message : 'Failed to save progress'
      });
      setState(prev => ({...prev, isNavigating: false}));
    }
  }, [state.currentStep, state.isNavigating, filteredSteps, saveProgress, validateStepFields, form]);

  const handlePrevious = useCallback(() => {
    if (state.currentStep > 0) {
      handleNavigation('previous');
    }
  }, [state.currentStep, handleNavigation]);
  
  const handleNext = useCallback(() => {
    if (state.currentStep < totalSteps - 1) {
      handleNavigation('next');
    }
  }, [state.currentStep, totalSteps, handleNavigation]);

  const setCurrentStep = useCallback((step: number) => {
    if (step >= 0 && step < totalSteps) {
      setState(prev => ({...prev, currentStep: step}));
    }
  }, [totalSteps]);

  return {
    currentStep: state.currentStep,
    isNavigating: state.isNavigating,
    validationErrors: state.validationErrors,
    completedSteps: state.completedSteps,
    stepValidationErrors: state.stepValidationErrors,
    handlePrevious,
    handleNext,
    setCurrentStep,
    navigationDisabled: state.isNavigating
  };
};
