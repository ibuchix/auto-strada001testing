
/**
 * StepForm Component
 * Updated: 2025-07-03 - Completely refactored to remove Next.js dependencies and fix type issues
 * Updated: 2025-07-24 - Fixed FormSubmissionContext import and related hooks
 * Updated: 2025-05-19 - Fixed property naming for error/submitError and isSuccessful
 * Updated: 2025-05-26 - Updated to use car-listing specific FormSubmission context
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FormStep } from "./types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { useFormSubmission } from "./submission/FormSubmissionProvider";
import { FormTransactionError } from "./submission/FormTransactionError";
import { TransactionStatus } from "./types";
import { useFormController } from "./hooks/useFormController";
import { useFormStorage } from "./hooks/useFormStorage";
import { useFormValidation } from "./hooks/useFormValidation";

interface StepFormProps {
  form: UseFormReturn<CarListingFormData>;
  steps: FormStep[];
  currentStep: number;
  setCurrentStep: (step: number) => void;
  carId?: string;
  lastSaved: Date | null;
  isOffline: boolean;
  saveProgress: () => Promise<boolean>;
  visibleSections: string[];
  isSaving: boolean;
  onComplete?: () => void;
}

export const StepForm = ({
  form,
  steps,
  currentStep,
  setCurrentStep,
  carId,
  lastSaved,
  isOffline,
  saveProgress,
  visibleSections,
  isSaving,
  onComplete
}: StepFormProps) => {
  const { validateCurrentStep } = useFormValidation(form);
  const { saveFormData } = useFormStorage();
  const formSubmission = useFormSubmission();
  const { isSubmitting, submitError } = formSubmission.submissionState;
  const { submitForm } = formSubmission;
  
  const [isFormComplete, setIsFormComplete] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const currentStepData = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  
  const {
    isDirty,
    resetDirtyState
  } = useFormController({ form, currentStep });
  
  // Reset validation error when step changes
  useEffect(() => {
    setValidationError(null);
  }, [currentStep]);
  
  // Save form data periodically when it's dirty
  useEffect(() => {
    if (isDirty) {
      const timer = setTimeout(() => {
        saveFormState();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isDirty, form.getValues()]);
  
  // Function to save the current form state
  const saveFormState = async (): Promise<boolean> => {
    try {
      const formData = form.getValues();
      await saveFormData(formData);
      resetDirtyState();
      return true;
    } catch (error) {
      console.error("Error saving form state:", error);
      return false;
    }
  };
  
  // Navigate to a specific step
  const goToStep = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStep(stepIndex);
      setValidationError(null);
    }
  };
  
  // Navigate to the previous step
  const goToPreviousStep = async () => {
    // Always save before navigating
    await saveFormState();
    goToStep(currentStep - 1);
  };
  
  // Navigate to the next step
  const navigateToNextStep = async (): Promise<boolean> => {
    try {
      // Validate current step
      const isValid = await validateCurrentStep();
      
      if (!isValid) {
        setValidationError("Please fix the errors before proceeding.");
        return false;
      }
      
      // Save form state
      const savedSuccessfully = await saveFormState();
      if (!savedSuccessfully) {
        setValidationError("Failed to save form state. Please try again.");
        return false;
      }
      
      // Navigate to next step if available
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
        return true;
      } else {
        // Otherwise, mark form as complete
        setIsFormComplete(true);
        return true;
      }
    } catch (error) {
      console.error("Error navigating to next step:", error);
      setValidationError("An unexpected error occurred. Please try again.");
      return false;
    }
  };
  
  // Handle form submission
  const handleFormSubmit = async () => {
    try {
      // Validate the current step first
      const isValid = await validateCurrentStep();
      
      if (!isValid) {
        setValidationError("Please fix the errors before submitting.");
        return;
      }
      
      // Save form state
      await saveFormState();
      
      // Get the form data
      const formData = form.getValues();
      
      // Submit the form
      await submitForm(formData);
      
      // If successful, mark as complete and call onComplete
      if (!submitError) {
        setIsFormComplete(true);
        if (onComplete) onComplete();
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setValidationError("Failed to submit form. Please try again.");
    }
  };

  // Helper to check if a step is completed
  const isStepCompleted = (stepIndex: number): boolean => {
    return false; // To be implemented with actual step completion logic
  };
  
  // Helper to check if a step has been visited
  const isStepVisited = (stepIndex: number): boolean => {
    return stepIndex <= currentStep; // Simplest implementation
  };
  
  // Render step navigation
  const renderStepNavigation = () => {
    return (
      <div className="flex justify-between mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={goToPreviousStep}
          disabled={isFirstStep || isSubmitting}
          className="flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        
        {isLastStep ? (
          <Button
            type="button"
            onClick={handleFormSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-1"
          >
            Submit
            {isSubmitting && (
              <span className="ml-2 animate-spin">⟳</span>
            )}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={navigateToNextStep}
            disabled={isSubmitting}
            className="flex items-center gap-1"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  };
  
  // Render step indicators
  const renderStepIndicators = () => {
    return (
      <div className="flex justify-center mb-6">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`
              flex items-center cursor-pointer
              ${index > 0 ? 'ml-2' : ''}
            `}
            onClick={() => goToStep(index)}
          >
            <div
              className={`
                h-3 w-3 rounded-full
                ${currentStep === index ? 'bg-primary' : ''}
                ${isStepCompleted(index) ? 'bg-green-500' : ''}
                ${!isStepCompleted(index) && currentStep !== index ? 'bg-gray-300' : ''}
                ${isStepVisited(index) && !isStepCompleted(index) ? 'bg-amber-400' : ''}
              `}
            />
            {index < steps.length - 1 && (
              <div className="h-0.5 w-4 bg-gray-300" />
            )}
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      {renderStepIndicators()}
      
      {validationError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}
      
      {submitError && (
        <FormTransactionError 
          error={submitError} 
          onRetry={() => setValidationError(null)} 
        />
      )}
      
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4 font-oswald">{currentStepData.title}</h2>
        {currentStepData.description && (
          <p className="text-gray-600 mb-6">{currentStepData.description}</p>
        )}
        
        {currentStepData.component}
        
        {renderStepNavigation()}
      </Card>
      
      {isSaving && (
        <div className="text-xs text-gray-500 text-right mt-2">
          Saving...
        </div>
      )}
    </div>
  );
};
