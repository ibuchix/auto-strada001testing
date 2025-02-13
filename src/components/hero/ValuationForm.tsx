
import { ValuationInput } from "./ValuationInput";
import { ValuationResult } from "./valuation/components/ValuationResult";
import { Dialog } from "@/components/ui/dialog";
import { useValuationForm } from "@/hooks/useValuationForm";
import { useAuth } from "@/components/AuthProvider";
import { useNavigate } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import { useEffect, useRef } from "react";

export const ValuationForm = () => {
  const {
    form,
    isLoading,
    showDialog,
    setShowDialog,
    valuationResult,
    onSubmit,
  } = useValuationForm();

  const { session } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const vinInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // If the focus=vin parameter is present, focus the VIN input
    if (searchParams.get('focus') === 'vin' && vinInputRef.current) {
      vinInputRef.current.focus();
    }
  }, [searchParams]);

  const handleSuccessfulValuation = () => {
    if (!session) {
      navigate('/auth');
    } else {
      navigate('/sell-my-car');
    }
    setShowDialog(false);
  };

  const handleManualValuation = () => {
    if (!session) {
      navigate('/auth');
    } else {
      navigate('/manual-valuation');
    }
    setShowDialog(false);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <ValuationInput 
        form={form}
        isLoading={isLoading}
        onSubmit={onSubmit}
        vinInputRef={vinInputRef}
      />
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        {valuationResult && (
          <ValuationResult 
            valuationResult={valuationResult}
            onContinue={handleSuccessfulValuation}
            onManualValuation={handleManualValuation}
            onClose={() => setShowDialog(false)}
          />
        )}
      </Dialog>
    </div>
  );
};
