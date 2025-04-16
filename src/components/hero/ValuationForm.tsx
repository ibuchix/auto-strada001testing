
/**
 * Changes made:
 * - Updated to use enhanced valuation form hook for better state management
 * - Improved performance with optimized React Hook Form integration
 * - Added form reset capability
 * - 2025-04-06: Fixed type issues with valuationResult
 * - 2025-04-17: Fixed import paths for error dialog
 * - 2025-04-17: Fixed error dialog button handling
 */

import { ValuationInput } from "./ValuationInput";
import { ValuationResult } from "./valuation/components/ValuationResult";
import { Dialog } from "@/components/ui/dialog";
import { useEnhancedValuationForm } from "@/hooks/valuation/useEnhancedValuationForm";
import { useValuationErrorDialog } from '@/hooks/valuation/useValuationErrorDialog';

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

  const { 
    handleClose: handleErrorClose,
    handleRetry: handleErrorRetry 
  } = useValuationErrorDialog();

  // Add explicit console logging for debugging event flow
  const handleDialogClose = () => {
    console.log("Dialog close triggered");
    setShowDialog(false);
  };

  const handleRetry = () => {
    console.log("Retry triggered from ValuationForm");
    handleErrorRetry();
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
            valuationResult={{
              make: valuationResult.data?.make,
              model: valuationResult.data?.model,
              year: valuationResult.data?.year,
              vin: valuationResult.data?.vin,
              transmission: valuationResult.data?.transmission,
              valuation: valuationResult.data?.valuation,
              reservePrice: valuationResult.data?.reservePrice,
              averagePrice: valuationResult.data?.averagePrice,
              isExisting: valuationResult.data?.isExisting,
              error: valuationResult.data?.error,
              noData: valuationResult.data?.noData,
            }}
            onContinue={handleContinue}
            onClose={handleDialogClose}
            onRetry={handleRetry}
          />
        )}
      </Dialog>
    </div>
  );
};
