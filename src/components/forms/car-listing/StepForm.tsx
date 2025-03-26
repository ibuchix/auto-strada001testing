
/**
 * Changes made:
 * - 2023-07-15: Created StepForm component for handling multi-step form display
 * - 2024-07-24: Fixed userId reference from form values
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
  
  // Get the user ID from form values or null if not available
  const userId = form.getValues().userId || '';
  
  return (
    <div className="space-y-8">
      {/* Progress indicator */}
      <FormProgress 
        progress={Math.round(((currentStep + 1) / (visibleSections.length || 1)) * 100)}
        currentStep={currentStep} 
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
          <LastSaved timestamp={lastSaved} isOffline={isOffline} />
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
        userId={userId}
        diagnosticId={diagnosticId}
      />
      
      {/* Next/Previous buttons */}
      <MultiStepFormControls 
        currentStep={currentStep} 
        onNext={handleNextStep} 
        onPrevious={handlePrevStep}
        onSubmit={() => {}}
        isSubmitting={false}
        isLastStep={currentStep === visibleSections.length - 1}
        isFirstStep={currentStep === 0}
        totalSteps={visibleSections.length}
      />
    </div>
  );
};
