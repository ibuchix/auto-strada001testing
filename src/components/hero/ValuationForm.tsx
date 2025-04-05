
/**
 * Changes made:
 * - Updated to use enhanced valuation form hook for better state management
 * - Improved performance with optimized React Hook Form integration
 * - Added form reset capability
 * - 2025-04-06: Fixed type issues with valuationResult
 */

import { ValuationInput } from "./ValuationInput";
import { ValuationResult } from "./valuation/components/ValuationResult";
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

  return (
    <div className="w-full max-w-md mx-auto">
      <ValuationInput 
        form={form}
        isLoading={isLoading}
        onSubmit={onSubmit}
      />
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
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
            onClose={() => setShowDialog(false)}
          />
        )}
      </Dialog>
    </div>
  );
};
