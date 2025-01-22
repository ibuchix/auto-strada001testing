import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useValuationState } from "./hooks/useValuationState";
import { getValuation } from "./services/valuationService";

export const useValuationForm = () => {
  const navigate = useNavigate();
  const { formState, setters } = useValuationState();
  
  const handleVinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Starting VIN validation with:', { 
      vin: formState.vin, 
      mileage: formState.mileage, 
      gearbox: formState.gearbox 
    });
    
    if (!formState.vin.trim()) {
      toast.error("Please enter your VIN number");
      return;
    }

    if (!formState.mileage.trim()) {
      toast.error("Please enter your vehicle's mileage");
      return;
    }

    const mileageNum = parseInt(formState.mileage);
    if (isNaN(mileageNum) || mileageNum <= 0 || mileageNum >= 1000000) {
      toast.error("Please enter a valid mileage between 0 and 1,000,000 km");
      return;
    }

    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(formState.vin)) {
      toast.error("Please enter a valid 17-character VIN");
      return;
    }

    setters.setIsLoading(true);
    try {
      const valuationData = await getValuation(
        formState.vin, 
        mileageNum, 
        formState.gearbox
      );

      if (!valuationData) {
        throw new Error("Could not retrieve valuation data");
      }

      localStorage.setItem('valuationData', JSON.stringify(valuationData));
      localStorage.setItem('tempVIN', formState.vin);
      localStorage.setItem('tempMileage', formState.mileage);
      localStorage.setItem('tempGearbox', formState.gearbox);

      setters.setValuationResult(valuationData);
      setters.setDialogOpen(true);
      toast.success("Valuation completed successfully!");
    } catch (error: any) {
      console.error('Error during valuation:', error);
      setters.setValuationResult({
        make: '',
        model: '',
        year: new Date().getFullYear(),
        vin: formState.vin,
        transmission: formState.gearbox,
        error: error.message || "Failed to get vehicle valuation"
      });
      setters.setDialogOpen(true);
    } finally {
      setters.setIsLoading(false);
    }
  };

  const handleContinue = () => {
    setters.setDialogOpen(false);
    navigate('/sell-my-car');
  };

  return {
    ...formState,
    setVin: setters.setVin,
    setMileage: setters.setMileage,
    setGearbox: setters.setGearbox,
    handleVinSubmit,
    handleContinue,
    setDialogOpen: setters.setDialogOpen,
  };
};