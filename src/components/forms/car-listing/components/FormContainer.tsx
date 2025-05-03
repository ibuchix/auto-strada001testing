
/**
 * FormContainer Component
 * Created: 2025-06-17
 * Updated: 2025-06-18 - Added proper imports and fixed AdditionalInfoSection integration
 * Updated: 2025-06-19 - Fixed ConditionSection import path
 * Updated: 2025-06-20 - Fixed incorrect import paths
 * Updated: 2025-07-26 - Fixed form section rendering and imports
 */

import { useFormData } from "../context/FormDataContext";
import { formSteps } from "../constants/formSteps";
import { FormSectionRenderer } from "./FormSectionRenderer";

interface FormContainerProps {
  currentStep: number;
  onNext?: () => void;
  onPrevious?: () => void;
  isFirstStep?: boolean;
  isLastStep?: boolean;
  navigationDisabled?: boolean;
  isSaving?: boolean;
  carId?: string;
  userId?: string;
}

export const FormContainer = ({
  currentStep,
  carId,
  userId
}: FormContainerProps) => {
  const { form } = useFormData();
  
  // Get current step sections
  const currentStepConfig = formSteps[currentStep];
  const currentSections = currentStepConfig?.sections || [];
  
  // Render sections based on current step
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-6">{currentStepConfig?.title || "Complete Your Listing"}</h2>
      <p className="text-gray-500 mb-6">{currentStepConfig?.description || "Please fill out the required information below"}</p>
      
      <div className="space-y-10">
        {currentSections.map((sectionId, index) => (
          <div key={`${sectionId}-${index}`} className="bg-white rounded-lg border p-6 shadow-sm">
            <FormSectionRenderer 
              sectionId={sectionId} 
              carId={carId}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
