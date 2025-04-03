
/**
 * Form Container component
 * - Handles displaying the appropriate components for the current step
 * - Updated to support consolidated multi-step steps
 * - Uses FormDataContext instead of direct form prop
 * - 2025-04-03: Fixed section component props to use FormDataContext
 * - 2025-04-03: Removed form prop from components that now use FormDataContext
 */
import { memo, useMemo } from "react";
import { formSteps } from "../constants/formSteps";
import { VehicleDetailsSection } from "../sections/VehicleDetailsSection";
import { PhotoUploadSection } from "../PhotoUploadSection";
import { RimPhotosSection } from "../RimPhotosSection";
import { VehicleStatusSection } from "../VehicleStatusSection";
import { FeaturesSection } from "../FeaturesSection";
import { DamageSection } from "../DamageSection";
import { WarningLightsSection } from "../WarningLightsSection";
import { ServiceHistorySection } from "../ServiceHistorySection";
import { AdditionalInfoSection } from "../AdditionalInfoSection";
import { PersonalDetailsSection } from "../PersonalDetailsSection";
import { FinanceDetailsSection } from "../FinanceDetailsSection";
import { SellerNotesSection } from "../SellerNotesSection";
import { useFormData } from "../context/FormDataContext";

interface FormContainerProps {
  currentStep: number;
  onNext: () => Promise<void>;
  onPrevious: () => Promise<void>;
  isFirstStep: boolean;
  isLastStep: boolean;
  navigationDisabled: boolean;
  isSaving: boolean;
  carId?: string;
  userId: string;
}

export const FormContainer = memo(({
  currentStep,
  carId,
  userId,
  onNext,
  onPrevious,
  isFirstStep,
  isLastStep,
  navigationDisabled,
  isSaving
}: FormContainerProps) => {
  // Get form from context
  const { form } = useFormData();
  
  // Get the current step configuration
  const currentStepConfig = formSteps[currentStep];
  
  // Map of component renderers by section ID
  const sectionRenderers = useMemo(() => ({
    'vehicle-details': () => <VehicleDetailsSection />,
    'photos': () => <PhotoUploadSection carId={carId} />,
    'rims': () => <RimPhotosSection carId={carId} />,
    'vehicle-status': () => <VehicleStatusSection />,
    'features': () => <FeaturesSection />,
    'damage': () => <DamageSection carId={carId} />,
    'warning-lights': () => <WarningLightsSection carId={carId} />,
    'service-history': () => <ServiceHistorySection carId={carId} />,
    'additional-info': () => <AdditionalInfoSection />,
    'personal-details': () => <PersonalDetailsSection />,
    'finance-details': () => <FinanceDetailsSection carId={carId} />,
    'seller-notes': () => <SellerNotesSection />
  }), [carId]);
  
  // Based on the current step's sections, render the appropriate components
  const renderSections = () => {
    if (!currentStepConfig) {
      return <div className="text-red-500">Invalid step configuration</div>;
    }
    
    return (
      <div className="space-y-8">
        {currentStepConfig.sections
          .filter(sectionId => {
            // Conditionally show sections based on form state
            if (sectionId === 'damage') {
              return form.watch('isDamaged') === true;
            }
            if (sectionId === 'warning-lights') {
              return form.watch('hasWarningLights') === true;
            }
            if (sectionId === 'finance-details') {
              return form.watch('hasOutstandingFinance') === true;
            }
            return true;
          })
          .map(sectionId => {
            const renderSection = sectionRenderers[sectionId];
            return renderSection ? (
              <div key={sectionId} className="section-container">
                {renderSection()}
              </div>
            ) : null;
          })}
      </div>
    );
  };

  return (
    <div className="form-container">
      <h2 className="text-2xl font-oswald font-bold mb-6 text-[#DC143C]">
        {currentStepConfig?.title || 'Form Step'}
      </h2>
      {currentStepConfig?.description && (
        <p className="text-sm text-gray-600 mb-6">{currentStepConfig.description}</p>
      )}
      
      {renderSections()}
    </div>
  );
});

FormContainer.displayName = 'FormContainer';
