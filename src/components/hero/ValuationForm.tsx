
/**
 * Changes made:
 * - 2025-04-28: Enhanced form validation and error handling
 */

import { ValuationInput } from "./ValuationInput";
import { ValuationResult } from "./ValuationResult";
import { Dialog } from "@/components/ui/dialog";
import { useEnhancedValuationForm } from "@/hooks/valuation/useEnhancedValuationForm";

export const ValuationForm = () => {
  const {
    form,
    isLoading,
    showDialog,
    setShowDialog,
    valuationResult,
    onSubmit,
    handleContinue,
    resetForm
  } = useEnhancedValuationForm();

  const handleDialogClose = () => {
    console.log("[ValuationForm] Dialog close triggered");
    setShowDialog(false);
  };

  const handleRetry = () => {
    console.log("[ValuationForm] Retry triggered");
    resetForm();
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <ValuationInput 
        form={form}
        isLoading={isLoading}
        onSubmit={onSubmit}
      />
      <Dialog open={showDialog} onOpenChange={handleDialogClose}>
        {valuationResult && (
          <ValuationResult 
            valuationResult={valuationResult}
            onContinue={handleContinue}
            onClose={handleDialogClose}
            onRetry={handleRetry}
          />
        )}
      </Dialog>
    </div>
  );
};
