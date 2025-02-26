
/**
 * Changes made:
 * - 2024-03-19: Initial implementation of valuation form
 * - 2024-03-19: Added result dialog integration
 * - 2024-03-19: Implemented form validation
 */

import { ValuationInput } from "./ValuationInput";
import { ValuationResult } from "./valuation/components/ValuationResult";
import { Dialog } from "@/components/ui/dialog";
import { useValuationForm } from "@/hooks/useValuationForm";

export const ValuationForm = () => {
  const {
    form,
    isLoading,
    showDialog,
    setShowDialog,
    valuationResult,
    onSubmit,
  } = useValuationForm();

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
            valuationResult={valuationResult}
            onContinue={() => {
              setShowDialog(false);
            }}
            onClose={() => setShowDialog(false)}
          />
        )}
      </Dialog>
    </div>
  );
};
