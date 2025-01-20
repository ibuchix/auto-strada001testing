import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useValuationState } from "./hooks/useValuationState";
import { getValuation } from "./services/valuationService";
import { ManualValuationData } from "../ManualValuationForm";
import { supabase } from "@/integrations/supabase/client";

export const useValuationForm = () => {
  const navigate = useNavigate();
  const { formState, setters } = useValuationState();
  
  const handleManualSubmit = async (data: ManualValuationData) => {
    console.log('Starting manual valuation with data:', data);
    setters.setIsLoading(true);

    try {
      // Ensure all required fields are included
      const requestData = {
        make: data.make,
        model: data.model,
        year: parseInt(data.year),
        mileage: parseInt(data.mileage),
        transmission: data.transmission,
        fuel: data.fuel || 'petrol',  // Ensure default value
        country: data.country || 'PL', // Ensure default value
        capacity: data.capacity ? parseInt(data.capacity) : undefined
      };

      console.log('Sending request with data:', requestData);

      const { data: response, error } = await supabase.functions.invoke('get-manual-valuation', {
        body: requestData
      });

      if (error) {
        console.error('Manual valuation error:', error);
        setters.setValuationResult({
          make: data.make,
          model: data.model,
          year: parseInt(data.year),
          vin: 'MANUAL',
          transmission: data.transmission,
          error: error.message || "Failed to get valuation. Please try again."
        });
        setters.setDialogOpen(true);
        return;
      }

      if (!response.success) {
        console.error('Manual valuation failed:', response.message);
        setters.setValuationResult({
          make: data.make,
          model: data.model,
          year: parseInt(data.year),
          vin: 'MANUAL',
          transmission: data.transmission,
          error: response.message || "Failed to get valuation. Please try again."
        });
        setters.setDialogOpen(true);
        return;
      }

      const valuationData = response.data;
      console.log('Received valuation data:', valuationData);

      localStorage.setItem('valuationData', JSON.stringify(valuationData));
      localStorage.setItem('tempMileage', data.mileage);
      localStorage.setItem('tempGearbox', data.transmission);

      setters.setValuationResult({
        ...valuationData,
        vin: 'MANUAL',
        year: parseInt(data.year)
      });
      setters.setShowManualForm(false);
      setters.setDialogOpen(true);
      toast.success("Valuation completed successfully!");
    } catch (error: any) {
      console.error('Manual valuation error:', error);
      setters.setValuationResult({
        make: data.make,
        model: data.model,
        year: parseInt(data.year),
        vin: 'MANUAL',
        transmission: data.transmission,
        error: error.message || "An unexpected error occurred. Please try again."
      });
      setters.setDialogOpen(true);
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
        error: error.message || "Failed to get vehicle valuation. Please try entering details manually."
      });
      setters.setDialogOpen(true);
    } finally {
      setters.setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setters.setDialogOpen(false);
    setters.setValuationResult(null);
    setters.setVin('');
    setters.setMileage('');
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
    handleRetry,
    setDialogOpen: setters.setDialogOpen,
    setShowManualForm: setters.setShowManualForm
  };
};