
/**
 * Changes made:
 * - 2027-07-24: Added support for diagnosticId prop for improved debugging
 * - 2027-07-25: Fixed TypeScript errors with property names and component props
 * - 2027-07-26: Fixed component props type issue by using conditional prop passing
 * - 2027-07-30: Added reset transaction handling for submission retries
 */

import { Session } from "@supabase/supabase-js";
import { useState } from "react";
import { SuccessDialog } from "./SuccessDialog";
import { useFormSubmissionContext } from "./submission/FormSubmissionProvider";
import { FormSections } from "./FormSections";
import { FormProgress } from "./FormProgress";
import { LastSaved } from "./LastSaved";
import { useCarListingForm } from "./hooks/useCarListingForm";
import { MultiStepFormControls } from "./MultiStepFormControls";
import { formSteps } from "./constants/formSteps";
import { RequirementsDisplay } from "./RequirementsDisplay";
import { logDiagnostic } from "@/diagnostics/listingButtonDiagnostics";

interface FormContentProps {
  session: Session;
  draftId?: string;
  diagnosticId?: string;
}

export const FormContent = ({ 
  session, 
  draftId,
  diagnosticId 
}: FormContentProps) => {
  const {
    form,
    carId,
    lastSaved,
    currentStep,
    setCurrentStep,
    validationErrors,
    saveProgress,
  } = useCarListingForm(session.user.id, draftId);

  const { 
    submitting, 
    handleSubmit,
    showSuccessDialog,
    setShowSuccessDialog,
    error: submissionError,
    transactionStatus,
    resetTransaction
  } = useFormSubmissionContext();

  const [isSubmitRequested, setIsSubmitRequested] = useState(false);

  // Log form initialization with diagnostic ID
  if (diagnosticId) {
    logDiagnostic(
      'FORM_CONTENT', 
      'Form content initialized', 
      { draftId, carId, currentStep }, 
      diagnosticId
    );
  }

  const handleSubmitClick = async () => {
    setIsSubmitRequested(true);
    await saveProgress();
    
    if (diagnosticId) {
      logDiagnostic(
        'FORM_SUBMISSION', 
        'Form submission triggered', 
        { carId, validationErrors: validationErrors.length }, 
        diagnosticId
      );
    }
    
    if (validationErrors.length > 0) {
      console.log('Cannot submit: Form has validation errors', validationErrors);
      return;
    }
    
    try {
      await handleSubmit(form.getValues(), carId);
    } catch (error) {
      console.error('Form submission error:', error);
      if (diagnosticId) {
        logDiagnostic(
          'SUBMISSION_ERROR', 
          'Form submission error caught', 
          { error }, 
          diagnosticId
        );
      }
    }
  };
  
  const handleRetrySubmission = () => {
    if (diagnosticId) {
      logDiagnostic(
        'SUBMISSION_RETRY', 
        'User requested submission retry', 
        { transactionStatus }, 
        diagnosticId
      );
    }
    
    // Reset the transaction state
    resetTransaction();
    
    // After a small delay, try submitting again
    setTimeout(() => {
      handleSubmitClick();
    }, 500);
  };

  // Calculate progress percentage based on current step
  const progressPercentage = Math.round((currentStep + 1) / formSteps.length * 100);

  return (
    <div className="form-container">
      <FormProgress 
        progress={progressPercentage} 
        steps={formSteps}
        currentStep={currentStep}
        onStepClick={setCurrentStep}
      />
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">
          {formSteps[currentStep]?.title}
        </h2>
        <LastSaved timestamp={lastSaved} />
      </div>
      
      <RequirementsDisplay 
        errors={validationErrors}
      />
      
      <FormSections
        form={form}
        currentStep={currentStep}
        carId={carId}
        userId={session.user.id}
        diagnosticId={diagnosticId}
      />
      
      <MultiStepFormControls 
        currentStep={currentStep}
        totalSteps={formSteps.length}
        onPrevious={() => setCurrentStep(Math.max(0, currentStep - 1))}
        onNext={() => setCurrentStep(Math.min(formSteps.length - 1, currentStep + 1))}
        onSubmit={handleSubmitClick}
        isSubmitting={submitting}
        isLastStep={currentStep === formSteps.length - 1}
        transactionStatus={transactionStatus}
        forceEnable={false}
        onRetry={handleRetrySubmission}
        diagnosticId={diagnosticId}
      />
      
      {showSuccessDialog && (
        <SuccessDialog 
          open={showSuccessDialog}
          onOpenChange={setShowSuccessDialog}
        />
      )}
    </div>
  );
};
