
/**
 * Changes made:
 * - 2025-04-28: Enhanced form validation and error handling
 * - 2025-04-29: Fixed dialog state handling to ensure results are displayed
 */

import { ValuationInput } from "./ValuationInput";
import { ValuationResult } from "./ValuationResult";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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

  console.log("[ValuationForm] Current state:", { 
    showDialog, 
    isLoading, 
    hasValuationResult: !!valuationResult,
    valuationResultSample: valuationResult ? 
      `${valuationResult.make || "?"} ${valuationResult.model || "?"} ${valuationResult.year || "?"}` : 
      "none" 
  });

  return (
    <div className="w-full max-w-md mx-auto">
      <ValuationInput 
        form={form}
        isLoading={isLoading}
        onSubmit={onSubmit}
      />
      <Dialog open={showDialog} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
          {valuationResult && (
            <ValuationResult 
              valuationResult={valuationResult}
              onContinue={handleContinue}
              onClose={handleDialogClose}
              onRetry={handleRetry}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
