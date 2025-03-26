
/**
 * Changes made:
 * - 2028-07-14: Created StepForm component for multi-step form navigation
 */

import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { FormSections } from "./FormSections";
import { MultiStepFormControls } from "./MultiStepFormControls";
import { FormProgress } from "./FormProgress";
import { LastSaved } from "./LastSaved";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wifi, WifiOff } from "lucide-react";
import { useEffect } from "react";
import { logDiagnostic } from "@/diagnostics/listingButtonDiagnostics";

interface StepFormProps {
  form: UseFormReturn<CarListingFormData>;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  carId?: string;
  lastSaved?: Date | null;
  isOffline?: boolean;
  saveProgress?: () => Promise<void>;
  formErrors?: Record<string, any>;
  visibleSections?: string[];
  diagnosticId?: string;
}

export const StepForm = ({
  form,
  currentStep,
  setCurrentStep,
  carId,
  lastSaved,
  isOffline,
  saveProgress,
  formErrors,
  visibleSections = [],
  diagnosticId
}: StepFormProps) => {
  
  useEffect(() => {
    if (diagnosticId) {
      logDiagnostic('STEP_CHANGE', `Form step changed to ${currentStep}`, {
        carId,
        currentStep
      }, diagnosticId);
    }
  }, [currentStep, carId, diagnosticId]);

  const handleNextStep = async () => {
    // Save progress before navigating to next step
    if (saveProgress) {
      await saveProgress();
    }
    
    setCurrentStep(currentStep + 1);
  };

  const handlePrevStep = async () => {
    // Save progress before navigating to previous step
    if (saveProgress) {
      await saveProgress();
    }
    
    setCurrentStep(currentStep - 1);
  };
  
  return (
    <div className="space-y-8">
      {/* Progress indicator */}
      <FormProgress 
        currentStep={currentStep} 
        totalSteps={visibleSections.length} 
      />
      
      {/* Offline indicator */}
      {isOffline && (
        <Alert variant="warning" className="bg-amber-50 border-amber-200">
          <WifiOff className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            You are currently offline. Your changes will be saved locally and uploaded when you reconnect.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Last saved indicator */}
      {lastSaved && (
        <div className="flex items-center justify-end text-xs text-muted-foreground">
          <LastSaved date={lastSaved} isOffline={isOffline} />
          {!isOffline && (
            <Wifi className="ml-1 h-3 w-3 text-green-500" />
          )}
        </div>
      )}
      
      {/* Form section content */}
      <FormSections 
        form={form} 
        currentStep={currentStep} 
        carId={carId}
        userId={form.getValues('userId') || ''}
        diagnosticId={diagnosticId}
      />
      
      {/* Next/Previous buttons */}
      <MultiStepFormControls 
        currentStep={currentStep} 
        onNext={handleNextStep} 
        onPrev={handlePrevStep}
        isLastStep={currentStep === visibleSections.length - 1}
        isFirstStep={currentStep === 0}
        saveProgress={saveProgress}
      />
    </div>
  );
};
