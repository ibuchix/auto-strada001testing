
import { ValuationInput } from "./ValuationInput";
import { ValuationResult } from "./ValuationResult";
import { Dialog } from "@/components/ui/dialog";
import { useValuationForm } from "./valuation/useValuationForm";
import { ValuationData } from "./valuation/types";

export const ValuationForm = () => {
  const {
    vin,
    setVin,
    mileage,
    setMileage,
    gearbox,
    setGearbox,
    isLoading,
    valuationResult,
    dialogOpen,
    handleVinSubmit,
    handleContinue,
    setDialogOpen,
  } = useValuationForm();

  return (
    <div className="w-full max-w-md mx-auto">
      <ValuationInput 
        vin={vin}
        mileage={mileage}
        gearbox={gearbox}
        isLoading={isLoading}
        onVinChange={setVin}
        onMileageChange={setMileage}
        onGearboxChange={setGearbox}
        onSubmit={handleVinSubmit}
      />
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        {valuationResult && (
          <ValuationResult 
            valuationResult={valuationResult as Required<ValuationData>}
            onContinue={handleContinue}
            onClose={() => setDialogOpen(false)}
          />
        )}
      </Dialog>
    </div>
  );
};
