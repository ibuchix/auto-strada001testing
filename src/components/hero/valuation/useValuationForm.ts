import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useValuationState } from "./hooks/useValuationState";
import { checkExistingVin, getValuation, createExistingValuation } from "./services/valuationService";
import { ManualValuationData } from "../ManualValuationForm";
import { supabase } from "@/integrations/supabase/client";

export const useValuationForm = () => {
  const navigate = useNavigate();
  const { formState, setters } = useValuationState();
  
  const handleManualSubmit = async (data: ManualValuationData) => {
    console.log('Starting manual valuation with data:', data);
    setters.setIsLoading(true);

    try {
      const { data: response, error } = await supabase.functions.invoke('get-manual-valuation', {
        body: {
          make: data.make,
          model: data.model,
          year: parseInt(data.year),
          mileage: parseInt(data.mileage),
          transmission: data.transmission,
        }
      });

      if (error) throw error;
      if (!response.success) throw new Error(response.message || "Failed to get valuation");

      const valuationData = response.data;
      console.log('Received valuation data:', valuationData);

      localStorage.setItem('valuationData', JSON.stringify(valuationData));
      localStorage.setItem('tempMileage', data.mileage);
      localStorage.setItem('tempGearbox', data.transmission);

      setters.setValuationResult(valuationData);
      setters.setShowManualForm(false);
      setters.setDialogOpen(true);
      toast.success("Valuation completed successfully!");
    } catch (error: any) {
      console.error('Manual valuation error:', error);
      toast.error(error.message || "Failed to get valuation. Please try again later.");
    } finally {
      setters.setIsLoading(false);
    }
  };

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
      const existingCar = await checkExistingVin(formState.vin);

      if (existingCar) {
        console.log('Found existing car:', existingCar);
        const valuationData = existingCar.valuation_data as any;
        const existingValuation = createExistingValuation(
          existingCar, 
          formState.vin, 
          formState.gearbox, 
          valuationData
        );

        setters.setValuationResult(existingValuation);
        setters.setDialogOpen(true);
        return;
      }

      const valuationData = await getValuation(
        formState.vin, 
        mileageNum, 
        formState.gearbox
      );

      localStorage.setItem('valuationData', JSON.stringify(valuationData));
      localStorage.setItem('tempVIN', formState.vin);
      localStorage.setItem('tempMileage', formState.mileage);
      localStorage.setItem('tempGearbox', formState.gearbox);

      setters.setValuationResult(valuationData);
      setters.setDialogOpen(true);
      toast.success("Valuation completed successfully!");
    } catch (error: any) {
      console.error('Error during valuation:', error);
      toast.error(error.message || "Failed to get vehicle valuation. Please try entering details manually.", {
        action: {
          label: "Enter Manually",
          onClick: () => setters.setShowManualForm(true)
        }
      });
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
    handleManualSubmit,
    handleVinSubmit,
    handleContinue,
    setDialogOpen: setters.setDialogOpen,
    setShowManualForm: setters.setShowManualForm
  };
};