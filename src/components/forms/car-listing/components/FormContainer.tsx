
/**
 * Form Container Component
 * Created: 2025-05-02
 * Updated: 2025-06-15 - Fixed import paths
 * 
 * Displays the appropriate form step content
 */

import { ReactNode } from "react";
import { BasicInfoSection } from "../sections/BasicInfoSection";
import { ConditionSection } from "../sections/ConditionSection";
import { PhotoUploadSection } from "../sections/PhotoUploadSection";
import { RimPhotosSection } from "../RimPhotosSection";
import { DamagePhotosSection } from "../sections/DamagePhotosSection";
import { ServiceHistoryUploader } from "../ServiceHistoryUploader";
import { formSteps } from "../constants/formSteps";
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
  userId: string;
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
  userId,
}: FormContainerProps) => {
  const { form } = useFormData();

  // Display the appropriate component based on the current step
  const renderStepContent = (): ReactNode => {
    const step = formSteps[currentStep];
    
    if (!step) return null;
    
    switch (step.id) {
      case "basic-info":
        return <BasicInfoSection />;
      case "condition":
        return <ConditionSection />;
      case "photos":
        return (
          <>
            <PhotoUploadSection carId={carId} />
            <ServiceHistoryUploader />
            <RimPhotosSection carId={carId} />
            <DamagePhotosSection />
          </>
        );
      default:
        return <div>Step not implemented: {step.id}</div>;
    }
  };

  return <div className="space-y-6">{renderStepContent()}</div>;
};
