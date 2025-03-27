
/**
 * Changes made:
 * - Centralized navigation logic with safe step transitions
 * - Improved validation with type-safe field mappings
 * - Enhanced error handling with specific error messages
 * - Optimized re-renders with memoized components
 * - Better type safety throughout the component
 */

import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { formSteps } from "./constants/formSteps";
import { FormSections } from "./FormSections";
import { Button } from "@/components/ui/button";
import { FormStepper } from "./FormStepper";
import { FormFooter } from "./FormFooter";
import { ArrowLeft, ArrowRight, AlertCircle } from "lucide-react";
import { useState, useCallback } from "react";
import { toast } from "sonner";

// Define field mappings for each step (should match your form structure)
const STEP_FIELD_MAPPINGS: Record<string, Array<keyof CarListingFormData>> = {
  'personal-details': ['name', 'email', 'phone', 'address', 'city', 'postalCode'],
  'vehicle-status': ['make', 'model', 'year', 'mileage', 'condition', 'isDamaged'],
  'features': ['features', 'transmission', 'fuelType', 'bodyType', 'color'],
  'additional-info': ['purchaseDate', 'ownershipStatus', 'serviceHistory', 'seatMaterial', 'numberOfKeys'],
  'photos': ['uploadedPhotos', 'mainPhoto'],
  'notes': ['sellerNotes', 'priceExpectation'],
  'rims': ['frontLeftRimPhoto', 'frontRightRimPhoto', 'rearLeftRimPhoto', 'rearRightRimPhoto'],
  'service-history': ['serviceDocuments', 'lastServiceDate', 'serviceHistoryType']
};

interface StepFormProps {
  form: UseFormReturn<CarListingFormData>;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  carId?: string;
  lastSaved: Date | null;
  isOffline: boolean;
  saveProgress: () => Promise<void>;
  visibleSections: string[];
  isSaving?: boolean;
}

export const StepForm = ({
  form,
  currentStep,
  setCurrentStep,
  carId,
  lastSaved,
  isOffline,
  saveProgress,
  visibleSections,
  isSaving = false
}: StepFormProps) => {
  const totalSteps = formSteps.length;
  const [isNavigating, setIsNavigating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Memoized field validator
  const validateStepFields = useCallback(async (stepId: string) => {
    const fieldsToValidate = STEP_FIELD_MAPPINGS[stepId] || [];
    if (fieldsToValidate.length === 0) return true;
    
    // Get current form values for logging
    const currentValues = form.getValues();
    console.log(`Validating fields for step ${currentStep}:`, fieldsToValidate);
    console.log('Current form values:', JSON.stringify(currentValues, null, 2));
    
    try {
      const result = await form.trigger(fieldsToValidate as any[]);
      
      if (!result) {
        // Log validation errors for debugging
        console.log('Validation errors:', form.formState.errors);
        
        // Extract field errors for better messaging
        const newValidationErrors: Record<string, string> = {};
        fieldsToValidate.forEach(field => {
          const errorMessage = form.formState.errors[field]?.message;
          if (errorMessage && typeof errorMessage === 'string') {
            newValidationErrors[field] = errorMessage;
          }
        });
        
        setValidationErrors(newValidationErrors);
      } else {
        // Clear validation errors if validation passes
        setValidationErrors({});
      }
      
      return result;
    } catch (error) {
      console.error('Validation error:', error);
      return false;
    }
  }, [form, currentStep]);

  // Unified navigation handler
  const handleNavigation = useCallback(async (direction: 'previous' | 'next') => {
    if (isSaving || isNavigating) return;

    setIsNavigating(true);
    setValidationErrors({});
    const newStep = direction === 'next' ? currentStep + 1 : currentStep - 1;

    try {
      // Validate current step before proceeding to next step
      if (direction === 'next') {
        const currentStepId = formSteps[currentStep]?.id;
        const isValid = await validateStepFields(currentStepId);
        
        if (!isValid) {
          setIsNavigating(false);
          
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
      setCurrentStep(newStep);
      console.log(`Navigating to ${direction} step: ${newStep}`);
      
    } catch (error) {
      console.error('Navigation error:', error);
      toast.error('Navigation failed', {
        description: error instanceof Error ? error.message : 'Failed to save progress'
      });
    } finally {
      setIsNavigating(false);
    }
  }, [currentStep, isSaving, isNavigating, saveProgress, setCurrentStep, validateStepFields, form]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      handleNavigation('previous');
    }
  }, [currentStep, handleNavigation]);
  
  const handleNext = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      handleNavigation('next');
    }
  }, [currentStep, totalSteps, handleNavigation]);

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  const navigationDisabled = isSaving || isNavigating;
  
  // Determine if the form has validation errors to display
  const hasValidationErrors = Object.keys(validationErrors).length > 0;

  return (
    <div className="space-y-8 max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-6">
      <div className="mb-10">
        <FormStepper 
          steps={formSteps} 
          currentStep={currentStep} 
          onStepChange={setCurrentStep}
          visibleSections={visibleSections}
        />
      </div>
      
      {hasValidationErrors && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-red-800">
                Please correct the following errors:
              </h3>
              <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                {Object.entries(validationErrors).map(([field, message]) => (
                  <li key={field} className="mt-1">
                    <button 
                      type="button"
                      className="text-left underline hover:text-red-800 focus:outline-none"
                      onClick={() => {
                        const element = document.getElementById(field);
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          element.focus();
                        }
                      }}
                    >
                      {message}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
      
      <div className="form-container min-h-[400px] mb-10">
        <FormSections 
          form={form} 
          currentStep={currentStep}
          carId={carId}
          userId={form.watch("seller_id") as string}
        />
      </div>
      
      <div className="flex justify-between items-center mt-12 border-t pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={handlePrevious}
          disabled={isFirstStep || navigationDisabled}
          className="w-32 h-11 text-base"
          aria-label={isFirstStep ? "Cannot go back" : "Previous step"}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {isNavigating ? "Saving..." : "Previous"}
        </Button>
        
        {!isLastStep ? (
          <Button
            type="button"
            onClick={handleNext}
            disabled={navigationDisabled}
            className="bg-[#DC143C] hover:bg-[#DC143C]/90 text-white w-32 h-11 text-base"
            aria-label={navigationDisabled ? "Saving changes" : "Next step"}
          >
            {isNavigating ? "Saving..." : "Next"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={navigationDisabled}
            className="bg-[#DC143C] hover:bg-[#DC143C]/90 text-white w-32 h-11 text-base"
            aria-label={navigationDisabled ? "Submitting..." : "Submit listing"}
          >
            Submit
          </Button>
        )}
      </div>
      
      <FormFooter
        lastSaved={lastSaved}
        isOffline={isOffline}
        onSave={saveProgress}
        isSaving={navigationDisabled}
      />
    </div>
  );
};
