
/**
 * Form Container component
 * - Handles displaying the appropriate components for the current step
 * - Updated to support consolidated multi-section steps
 */
import { memo, useMemo } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { FormSections } from "../FormSections";
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

interface FormContainerProps {
  form: UseFormReturn<CarListingFormData>;
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
  form,
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
  // Get the current step configuration
  const currentStepConfig = formSteps[currentStep];
  
  // Map of component renderers by section ID
  const sectionRenderers = useMemo(() => ({
    'vehicle-details': () => <VehicleDetailsSection form={form} />,
    'photos': () => <PhotoUploadSection form={form} carId={carId} />,
    'rims': () => <RimPhotosSection form={form} carId={carId} />,
    'vehicle-status': () => <VehicleStatusSection form={form} />,
    'features': () => <FeaturesSection form={form} />,
    'damage': () => <DamageSection form={form} />,
    'warning-lights': () => <WarningLightsSection form={form} carId={carId} />,
    'service-history': () => <ServiceHistorySection form={form} carId={carId} />,
    'additional-info': () => <AdditionalInfoSection form={form} />,
    'personal-details': () => <PersonalDetailsSection form={form} />,
    'finance-details': () => <FinanceDetailsSection form={form} />,
    'seller-notes': () => <SellerNotesSection form={form} />
  }), [form, carId]);
  
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
