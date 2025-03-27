
/**
 * Changes made:
 * - Improved automatic saving during step navigation
 * - Added validation check before proceeding to next step
 * - Added feedback during saving process
 * - Optimized step navigation logic
 */

import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { formSteps } from "./constants/formSteps";
import { FormSections } from "./FormSections";
import { Button } from "@/components/ui/button";
import { FormStepper } from "./FormStepper";
import { FormFooter } from "./FormFooter";
import { ArrowLeft, ArrowRight } from "lucide-react";
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
  
  // Handle navigation to previous step
  const handlePrevious = async () => {
    if (currentStep > 0 && !isSaving && !isNavigating) {
      setIsNavigating(true);
      
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
      
      // Validate current step fields
      const currentStepId = formSteps[currentStep]?.id;
      const fieldsToValidate = getFieldsToValidate(currentStepId);
      
      // Trigger validation only for current step fields
      const isValid = await validateStepFields(fieldsToValidate);
      
      if (!isValid) {
        setIsNavigating(false);
        toast.error("Please complete all required fields", {
          description: "Some information is missing or incorrect."
        });
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
    // This is a simplified example - you would map step IDs to related form fields
    const fieldMappings: Record<string, string[]> = {
      'vehicle-details': ['make', 'model', 'year', 'mileage'],
      'photos': ['uploadedPhotos'],
      'personal-details': ['name', 'address', 'mobileNumber'],
      'notes': ['sellerNotes'],
      // Add more step ID to field mappings as needed
    };
    
    return fieldMappings[stepId] || [];
  };
  
  // Validate only the fields for the current step
  const validateStepFields = async (fields: string[]): Promise<boolean> => {
    if (fields.length === 0) return true;
    
    const result = await form.trigger(fields as any[]);
    return result;
  };
  
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
