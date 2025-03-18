
/**
 * Changes made:
 * - 2024-03-19: Initial implementation of valuation form
 * - 2024-03-19: Added result dialog integration
 * - 2024-03-19: Implemented form validation
 * - 2024-10-28: Updated to use the new useValuationForm hook
 * - 2024-10-29: Fixed navigation and prop interface
 */

import { ValuationInput } from "./ValuationInput";
import { ValuationResult } from "./valuation/components/ValuationResult";
import { Dialog } from "@/components/ui/dialog";
import { useValuationForm } from "@/hooks/useValuationForm";
import { useAuth } from "@/components/AuthProvider";
import { useNavigate } from "react-router-dom";

interface ValuationFormProps {
  valuationContext?: 'home' | 'seller';
}

export const ValuationForm = ({ valuationContext = 'home' }: ValuationFormProps) => {
  const { session } = useAuth();
  const navigate = useNavigate();
  
  const {
    form,
    isLoading,
    showDialog,
    setShowDialog,
    valuationResult,
    onSubmit
  } = useValuationForm(valuationContext);

  // Merge valuation result with session data for the component
  const resultData = valuationResult ? {
    ...valuationResult,
    vin: localStorage.getItem('tempVIN') || '',
    transmission: localStorage.getItem('tempGearbox') || 'automatic'
  } : null;

  return (
    <div className="w-full max-w-md mx-auto">
      <ValuationInput 
        form={form}
        isLoading={isLoading}
        onSubmit={onSubmit}
      />
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        {resultData && (
          <ValuationResult 
            valuationResult={resultData}
            onContinue={() => {
              setShowDialog(false);
              // Navigate to sell-my-car page with valuation data
              navigate('/sell-my-car', { 
                state: { 
                  fromValuation: true,
                  valuationData: resultData 
                } 
              });
            }}
            onClose={() => setShowDialog(false)}
            context={valuationContext} // Pass context to determine behavior
          />
        )}
      </Dialog>
    </div>
  );
};
