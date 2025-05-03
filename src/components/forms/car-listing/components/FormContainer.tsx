
/**
 * FormContainer Component
 * Created: 2025-06-17
 * Updated: 2025-06-18 - Added proper imports and fixed AdditionalInfoSection integration
 * Updated: 2025-06-19 - Fixed ConditionSection import path
 * 
 * Container component that renders the appropriate section based on current step
 */

import { BasicInfoSection } from "../BasicInfoSection";
import { ConditionSection } from "../sections/ConditionSection";
import { PhotosSection } from "../sections/PhotosSection";
import { AdditionalInfoSection } from "../AdditionalInfoSection";
import { DamagePhotosSection } from "../DamagePhotosSection";
import { ServiceHistorySection } from "../ServiceHistorySection";
import { formSteps } from "../constants/formSteps";
import { FormDataProvider } from "../context/FormDataContext";
import { useFormData } from "../context/FormDataContext";

interface FormContainerProps {
  currentStep: number;
  onNext: () => void;
  onPrevious: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  navigationDisabled: boolean;
  isSaving: boolean;
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
      <h2 className="text-2xl font-bold mb-6">{currentStepConfig?.title}</h2>
      <p className="text-gray-500 mb-6">{currentStepConfig?.description}</p>
      
      {/* Basic Information Step */}
      {currentSections.includes('car-details') && <BasicInfoSection />}
      
      {/* Additional Info Section */}
      {currentSections.includes('additional-info') && <AdditionalInfoSection />}
      
      {/* Condition Step */}
      {currentSections.includes('condition') && <ConditionSection />}
      
      {/* Service History Section */}
      {currentSections.includes('service-history') && <ServiceHistorySection />}
      
      {/* Photos Section */}
      {currentSections.includes('photos') && <PhotosSection carId={carId} />}
      
      {/* Damage Photos Section */}
      {currentSections.includes('damage-photos') && <DamagePhotosSection />}
    </div>
  );
};
