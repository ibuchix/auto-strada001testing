
/**
 * Form Container component to manage the display of form steps
 * Updated: 2025-06-05 - Fixed TypeScript errors and type safety issues
 * Updated: 2025-06-06 - Fixed missing children prop in FormSection
 * Updated: 2025-06-07 - Completely refactored to use FormSectionRenderer and fixed section rendering
 * Updated: 2025-06-08 - Removed duplicate FormSubmissionButtons to fix duplicate save buttons
 */

import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { FormSection } from "../FormSection";
import { formSteps } from "../constants/formSteps";
import { FormSectionRenderer } from "./FormSectionRenderer";
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
  
  if (!currentStepConfig) {
    console.error(`No step configuration found for step ${currentStep}`);
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-600">Error: Invalid form step</p>
      </div>
    );
  }
  
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
          <FormSection 
            key={sectionId} 
            id={sectionId}
            title={getSectionTitle(sectionId)}
            subtitle={getSectionSubtitle(sectionId)}
          >
            <FormSectionRenderer 
              sectionId={sectionId}
              carId={carId}
              pauseAutoSave={pauseAutoSave}
              resumeAutoSave={resumeAutoSave}
            />
          </FormSection>
        ))}
      </div>
      
      {/* Removed duplicate FormSubmissionButtons - navigation is now handled by FormNavigationControls only */}
    </div>
  );
};

// Helper function to get section titles
function getSectionTitle(sectionId: string): string {
  switch (sectionId) {
    case 'vehicle-info':
      return 'Vehicle Information';
    case 'vehicle-status':
      return 'Vehicle Status';
    case 'damage-details':
      return 'Damage Details';
    case 'features':
      return 'Vehicle Features';
    case 'service-history':
      return 'Service History';
    case 'personal-details':
      return 'Personal Details';
    case 'seller-notes':
      return 'Additional Notes';
    case 'additional-info':
      return 'Additional Information';
    case 'images':
      return 'Vehicle Photos';
    case 'reserve-price':
      return 'Reserve Price';
    default:
      return sectionId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }
}

// Helper function to get section subtitles
function getSectionSubtitle(sectionId: string): string | undefined {
  switch (sectionId) {
    case 'vehicle-info':
      return 'Enter the basic details of your vehicle';
    case 'damage-details':
      return 'Please report any damage to your vehicle';
    case 'images':
      return 'Upload clear photos of your vehicle (min. 4 photos required)';
    case 'service-history':
      return 'Information about your vehicle service history';
    case 'reserve-price':
      return 'The minimum price your vehicle will be sold for';
    default:
      return undefined;
  }
}
