
/**
 * Changes made:
 * - Improved automatic saving during step navigation
 * - Enhanced validation check before proceeding to next step with field-specific feedback
 * - Added comprehensive validation mapping for each form section
 * - Improved error messaging and user feedback during validation
 * - Optimized step navigation logic with better error handling
 */

import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { formSteps } from "./constants/formSteps";
import { FormSections } from "./FormSections";
import { Button } from "@/components/ui/button";
import { FormStepper } from "./FormStepper";
import { FormFooter } from "./FormFooter";
import { ArrowLeft, ArrowRight, AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface StepFormProps {
  form: UseFormReturn<CarListingFormData>;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  carId?: string;
  lastSaved: Date | null;
  isOffline: boolean;
  saveProgress: () => void;
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
  
  // Handle navigation to previous step
  const handlePrevious = async () => {
    if (currentStep > 0 && !isSaving && !isNavigating) {
      setIsNavigating(true);
      setValidationErrors({});
      
      try {
        // Save progress before moving to previous step
        await saveProgress();
        setCurrentStep(currentStep - 1);
        console.log(`Navigating to previous step: ${currentStep - 1}`);
      } catch (error) {
        console.error("Error saving progress:", error);
        toast.error("Failed to save progress", {
          description: "Your changes may not be saved. Please try again."
        });
      } finally {
        setIsNavigating(false);
      }
    }
  };
  
  // Handle navigation to next step
  const handleNext = async () => {
    if (currentStep < totalSteps - 1 && !isSaving && !isNavigating) {
      setIsNavigating(true);
      setValidationErrors({});
      
      // Validate current step fields
      const currentStepId = formSteps[currentStep]?.id;
      const fieldsToValidate = getFieldsToValidate(currentStepId);
      
      // Trigger validation only for current step fields
      const isValid = await validateStepFields(fieldsToValidate);
      
      if (!isValid) {
        setIsNavigating(false);
        
        // Get the errors from the form state
        const formErrors = form.formState.errors;
        const errorFields = Object.keys(formErrors);
        
        if (errorFields.length > 0) {
          // Extract field errors for better messaging
          const newValidationErrors: Record<string, string> = {};
          errorFields.forEach(field => {
            const errorMessage = formErrors[field as keyof typeof formErrors]?.message;
            if (errorMessage && typeof errorMessage === 'string') {
              newValidationErrors[field] = errorMessage;
            }
          });
          
          setValidationErrors(newValidationErrors);
          
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
      
      try {
        // Save progress before moving to next step
        await saveProgress();
        setCurrentStep(currentStep + 1);
        console.log(`Navigating to next step: ${currentStep + 1}`);
      } catch (error) {
        console.error("Error saving progress:", error);
        toast.error("Failed to save progress", {
          description: "Your changes may not be saved. Please try again."
        });
      } finally {
        setIsNavigating(false);
      }
    }
  };
  
  // Get the fields that need to be validated for the current step
  const getFieldsToValidate = (stepId: string): string[] => {
    // Comprehensive mapping of step IDs to form fields
    const fieldMappings: Record<string, string[]> = {
      'personal-details': ['name', 'email', 'phone', 'address', 'city', 'postalCode'],
      'vehicle-status': ['make', 'model', 'year', 'mileage', 'condition', 'isDamaged'],
      'features': ['features', 'transmission', 'fuelType', 'bodyType', 'color'],
      'additional-info': ['purchaseDate', 'ownershipStatus', 'serviceHistory', 'hasDocumentation'],
      'photos': ['uploadedPhotos', 'mainPhoto'],
      'notes': ['sellerNotes', 'priceExpectation'],
      'rims': ['frontLeftRimPhoto', 'frontRightRimPhoto', 'rearLeftRimPhoto', 'rearRightRimPhoto'],
      'service-history': ['serviceDocuments', 'lastServiceDate']
    };
    
    return fieldMappings[stepId] || [];
  };
  
  // Validate only the fields for the current step
  const validateStepFields = async (fields: string[]): Promise<boolean> => {
    if (fields.length === 0) return true;
    
    // Get current form values for logging
    const currentValues = form.getValues();
    console.log(`Validating fields for step ${currentStep}:`, fields);
    console.log('Current form values:', JSON.stringify(currentValues, null, 2));
    
    try {
      const result = await form.trigger(fields as any[]);
      
      if (!result) {
        // Log validation errors for debugging
        console.log('Validation errors:', form.formState.errors);
      }
      
      return result;
    } catch (error) {
      console.error('Error during field validation:', error);
      return false;
    }
  };
  
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
          disabled={currentStep === 0 || isSaving || isNavigating}
          className="w-32 h-11 text-base"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {isNavigating ? "Saving..." : "Previous"}
        </Button>
        
        {currentStep < totalSteps - 1 ? (
          <Button
            type="button"
            onClick={handleNext}
            disabled={isSaving || isNavigating}
            className="bg-[#DC143C] hover:bg-[#DC143C]/90 text-white w-32 h-11 text-base"
          >
            {isNavigating ? "Saving..." : "Next"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={isSaving || isNavigating}
            className="bg-[#DC143C] hover:bg-[#DC143C]/90 text-white w-32 h-11 text-base"
          >
            Submit
          </Button>
        )}
      </div>
      
      <FormFooter
        lastSaved={lastSaved}
        isOffline={isOffline}
        onSave={saveProgress}
        isSaving={isSaving || isNavigating}
      />
    </div>
  );
};
