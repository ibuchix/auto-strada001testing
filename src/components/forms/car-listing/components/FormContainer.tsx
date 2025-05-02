
/**
 * Form Container component to manage the display of form steps
 * Updated: 2025-06-05 - Fixed TypeScript errors and type safety issues
 * Updated: 2025-06-06 - Fixed missing children prop in FormSection
 */

import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { FormSection } from "../FormSection";
import { formSteps } from "../constants/formSteps";
import { FormSubmissionButtons } from "./FormSubmissionButtons";
import { ImageUploadSection } from "./ImageUploadSection";
import { useFeatureToggle } from "@/hooks/useFeatureToggle";

interface FormContainerProps {
  currentStep: number;
  onNext: () => Promise<void>;
  onPrevious: () => Promise<void>;
  isFirstStep: boolean;
  isLastStep: boolean;
  navigationDisabled: boolean;
  isSaving: boolean;
  carId?: string;
  userId?: string;
}

export const FormContainer = ({
  currentStep,
  onNext,
  onPrevious,
  isFirstStep,
  isLastStep,
  navigationDisabled,
  isSaving,
  carId,
  userId
}: FormContainerProps) => {
  const form = useFormContext<CarListingFormData>();
  
  // Get pauseAutoSave and resumeAutoSave from context
  const controller = (window as any).__formController;
  const pauseAutoSave = controller?.pauseAutoSave;
  const resumeAutoSave = controller?.resumeAutoSave;
  
  // Store form controller in window for debug access
  useEffect(() => {
    if (form && !(window as any).__DEBUG_MODE) {
      (window as any).__formController = {
        pauseAutoSave,
        resumeAutoSave,
        form
      };
    }
  }, [form, pauseAutoSave, resumeAutoSave]);

  // Get current step configuration
  const currentStepConfig = formSteps[currentStep];
  
  return (
    <div className="space-y-8">
      {/* Show active step content */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-[#383B39]">
          {currentStepConfig?.title || `Step ${currentStep + 1}`}
        </h2>
        
        {currentStepConfig?.description && (
          <p className="text-gray-600">{currentStepConfig.description}</p>
        )}
        
        {/* Render the appropriate form sections for the current step */}
        {currentStepConfig?.sections.map((sectionId) => (
          <FormSection key={sectionId} id={sectionId}>
            {/* We need to render content for each section */}
            <div className="section-content">
              {/* Section content will be determined by the specific section ID */}
              {sectionId === 'vehicle-info' && <p>Vehicle information fields</p>}
              {sectionId === 'vehicle-status' && <p>Vehicle status fields</p>}
              {sectionId === 'damage-details' && <p>Damage details fields</p>}
              {sectionId === 'features' && <p>Features selection</p>}
              {sectionId === 'service-history' && <p>Service history fields</p>}
              {sectionId === 'personal-details' && <p>Personal details fields</p>}
            </div>
          </FormSection>
        ))}
        
        {/* Show image upload section in the appropriate step */}
        {currentStepConfig?.sections.includes('images') && (
          <ImageUploadSection 
            maxImages={10}
            carId={carId}
            pauseAutoSave={pauseAutoSave}
            resumeAutoSave={resumeAutoSave}
          />
        )}
      </div>
      
      {/* Form navigation and submission buttons */}
      <FormSubmissionButtons
        isLastStep={isLastStep} 
        isSubmitting={navigationDisabled}
        isSaving={isSaving}
        isOffline={false}
        onSaveAndContinue={onNext}
        onSave={onPrevious}
        currentStep={currentStep}
      />
    </div>
  );
};
