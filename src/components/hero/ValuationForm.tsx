import { ValuationInput } from "./ValuationInput";
import { ValuationResult } from "./ValuationResult";
import { Dialog } from "@/components/ui/dialog";
import { ManualValuationForm } from "./ManualValuationForm";
import { useValuationForm } from "./valuation/useValuationForm";

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
    setDialogOpen,
    showManualForm,
    setShowManualForm,
    handleManualSubmit,
    handleVinSubmit,
    handleContinue
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
        onManualEntry={() => setShowManualForm(true)}
      />
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        {valuationResult && (
          <ValuationResult 
            valuationResult={valuationResult}
            onContinue={handleContinue}
          />
        )}
      </Dialog>
      <ManualValuationForm 
        isOpen={showManualForm}
        onClose={() => setShowManualForm(false)}
        onSubmit={handleManualSubmit}
        mileage={mileage}
        transmission={gearbox}
      />
    </div>
  );
};