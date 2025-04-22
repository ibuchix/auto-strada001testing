
/**
 * Changes made:
 * - Updated to use enhanced valuation form hook for better state management
 * - Improved performance with optimized React Hook Form integration
 * - Added form reset capability
 * - 2025-04-06: Fixed type issues with valuationResult
 * - 2025-04-17: Fixed import paths for error dialog
 * - 2025-04-17: Fixed error dialog button handling
 * - 2025-04-18: Improved error handling for proper dialog interaction
 * - 2025-04-19: Fixed valuation process to properly show results for valid VINs
 * - 2025-04-20: Fixed type issues with form handling and simplified props
 * - 2025-04-21: Fixed type compatibility between ValuationForm and ValuationResult
 * - 2025-04-22: Added additional debugging and improved data handling
 * - 2025-04-23: Fixed React state queue error by properly handling dialog state
 * - 2025-04-23: Fixed ValuationResult import path
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

  // Add explicit console logging for debugging event flow
  const handleDialogClose = () => {
    console.log("Dialog close triggered from ValuationForm");
    setShowDialog(false);
  };

  const handleRetry = () => {
    console.log("Retry triggered from ValuationForm with improved implementation");
    resetForm();
  };
  
  // Add debugging for valuationResult
  console.log("Current valuation result in ValuationForm:", {
    hasResult: !!valuationResult,
    resultKeys: valuationResult ? Object.keys(valuationResult) : [],
  });

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
