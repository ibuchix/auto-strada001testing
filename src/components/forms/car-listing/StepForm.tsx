/**
 * StepForm Component
 * Updated: 2025-06-23 - Fixed Promise return type in navigateToNextStep
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useFormData } from "./context/FormDataContext";
import { FormStep } from "./types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useFormState } from "@/context/FormStateContext";
import { useFormNavigation } from "./hooks/useFormNavigation";
import { useFormValidation } from "./hooks/useFormValidation";
import { useFormSubmissionContext } from "./submission/FormSubmissionProvider";
import { FormTransactionError } from "./submission/FormTransactionError";
import { TransactionStatus } from "@/services/supabase/transactions/types";
import { useFormController } from "./hooks/useFormController";
import { useFormStorage } from "./hooks/useFormStorage";

interface StepFormProps {
  steps: FormStep[];
  onComplete: () => void;
  showSubmitButton?: boolean;
  allowSkipToIncomplete?: boolean;
}

export const StepForm = ({
  steps,
  onComplete,
  showSubmitButton = true,
  allowSkipToIncomplete = false
}: StepFormProps) => {
  const { form, formState } = useFormData();
  const { updateFormState } = useFormState();
  const { validateStep } = useFormValidation();
  const { saveFormData } = useFormStorage();
  const { isSubmitting, error, transactionStatus, handleSubmit } = useFormSubmissionContext();
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isFormComplete, setIsFormComplete] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;
  
  const { 
    canNavigateToStep,
    markStepVisited,
    markStepCompleted,
    isStepCompleted,
    isStepVisited
  } = useFormNavigation(steps);
  
  const {
    isDirty,
    isStepValid,
    validateCurrentStep,
    resetDirtyState
  } = useFormController(currentStep, form);
  
  // Reset validation error when step changes
  useEffect(() => {
    setValidationError(null);
  }, [currentStepIndex]);
  
  // Save form state when component unmounts
  useEffect(() => {
    return () => {
      updateFormState({
        lastStep: currentStepIndex,
        isComplete: isFormComplete
      });
    };
  }, [currentStepIndex, isFormComplete, updateFormState]);
  
  // Mark current step as visited when it changes
  useEffect(() => {
    markStepVisited(currentStepIndex);
  }, [currentStepIndex, markStepVisited]);
  
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
      setIsSaving(true);
      const formData = form.getValues();
      await saveFormData(formData);
      resetDirtyState();
      return true;
    } catch (error) {
      console.error("Error saving form state:", error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };
  
  // Navigate to a specific step
  const goToStep = (stepIndex: number) => {
    if (
      stepIndex >= 0 &&
      stepIndex < steps.length &&
      (allowSkipToIncomplete || canNavigateToStep(stepIndex))
    ) {
      setCurrentStepIndex(stepIndex);
      setValidationError(null);
    }
  };
  
  // Navigate to the previous step
  const goToPreviousStep = async () => {
    // Always save before navigating
    await saveFormState();
    goToStep(currentStepIndex - 1);
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
      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1);
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
      await handleSubmit(formData);
      
      // If successful, mark as complete and call onComplete
      if (transactionStatus === TransactionStatus.SUCCESS) {
        setIsFormComplete(true);
        onComplete();
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setValidationError("Failed to submit form. Please try again.");
    }
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
        
        {isLastStep && showSubmitButton ? (
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
                ${currentStepIndex === index ? 'bg-primary' : ''}
                ${isStepCompleted(index) ? 'bg-green-500' : ''}
                ${!isStepCompleted(index) && currentStepIndex !== index ? 'bg-gray-300' : ''}
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
      
      {error && (
        <FormTransactionError 
          error={error} 
          onRetry={() => setValidationError(null)} 
        />
      )}
      
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4 font-oswald">{currentStep.title}</h2>
        {currentStep.description && (
          <p className="text-gray-600 mb-6">{currentStep.description}</p>
        )}
        
        {currentStep.component}
        
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
