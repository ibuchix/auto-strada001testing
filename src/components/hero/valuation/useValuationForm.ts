import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ManualValuationData } from "../ManualValuationForm";
import { Database } from "@/integrations/supabase/types";

type TransmissionType = Database['public']['Enums']['car_transmission_type'];

export const useValuationForm = () => {
  const [vin, setVin] = useState("");
  const [mileage, setMileage] = useState("");
  const [gearbox, setGearbox] = useState<TransmissionType>("manual");
  const [isLoading, setIsLoading] = useState(false);
  const [valuationResult, setValuationResult] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const navigate = useNavigate();

  const handleManualSubmit = async (data: ManualValuationData) => {
    console.log('Starting manual valuation with data:', data);
    setIsLoading(true);

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

      if (error) {
        console.error('Manual valuation error:', error);
        toast.error("Failed to get valuation. Please try again later.");
        return;
      }

      if (!response.success) {
        console.error('Manual valuation failed:', response);
        toast.error(response.message || "Failed to get valuation");
        return;
      }

      const valuationData = response.data;
      console.log('Received valuation data:', valuationData);

      localStorage.setItem('valuationData', JSON.stringify(valuationData));
      localStorage.setItem('tempMileage', data.mileage);
      localStorage.setItem('tempGearbox', data.transmission);

      setValuationResult(valuationData);
      setShowManualForm(false);
      setDialogOpen(true);
      toast.success("Valuation completed successfully!");
    } catch (error: any) {
      console.error('Manual valuation error:', error);
      toast.error("Failed to get valuation. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Starting VIN validation with:', { vin, mileage, gearbox });
    
    if (!vin.trim()) {
      toast.error("Please enter your VIN number");
      return;
    }

    if (!mileage.trim()) {
      toast.error("Please enter your vehicle's mileage");
      return;
    }

    setIsLoading(true);
    try {
      console.log('Checking for existing VIN in database');
      const { data: existingCar, error: vinCheckError } = await supabase
        .from('cars')
        .select('id, make, model, year, mileage, price, valuation_data')
        .eq('vin', vin)
        .eq('is_draft', false)
        .maybeSingle();

      console.log('VIN check result:', { existingCar, vinCheckError });

      if (vinCheckError) {
        console.error('VIN check error:', vinCheckError);
        toast.error("Error checking VIN. Please try again.");
        setIsLoading(false);
        return;
      }

      if (existingCar) {
        console.log('Found existing car:', existingCar);
        // Use existing car data to create a valuation result
        const existingValuation = {
          make: existingCar.make,
          model: existingCar.model,
          year: existingCar.year,
          vin: vin,
          transmission: gearbox,
          valuation: existingCar.valuation_data?.valuation || existingCar.price,
          isExisting: true
        };

        setValuationResult(existingValuation);
        setDialogOpen(true);
        setIsLoading(false);
        return;
      }

      console.log('Proceeding with Edge Function call');
      const { data, error } = await supabase.functions.invoke('get-car-valuation', {
        body: { 
          vin: vin.trim(),
          mileage: parseInt(mileage),
          gearbox 
        }
      });

      console.log('Edge Function response:', { data, error });

      if (error) {
        console.error('Valuation error:', error);
        toast.error("Failed to get vehicle valuation. Please try entering details manually.", {
          action: {
            label: "Enter Manually",
            onClick: () => setShowManualForm(true)
          }
        });
        return;
      }

      if (!data?.success) {
        console.error('Valuation failed:', data);
        toast.error(data?.message || "Failed to get vehicle valuation. Please try entering details manually.", {
          action: {
            label: "Enter Manually",
            onClick: () => setShowManualForm(true)
          }
        });
        return;
      }

      const valuationData = data.data;
      console.log('Processing valuation data:', valuationData);
      
      if (!valuationData) {
        console.error('No valuation data received');
        toast.error("Failed to get vehicle valuation. Please try entering details manually.", {
          action: {
            label: "Enter Manually",
            onClick: () => setShowManualForm(true)
          }
        });
        return;
      }

      localStorage.setItem('valuationData', JSON.stringify(valuationData));
      localStorage.setItem('tempVIN', vin);
      localStorage.setItem('tempMileage', mileage);
      localStorage.setItem('tempGearbox', gearbox);

      setValuationResult(valuationData);
      setDialogOpen(true);
      toast.success("Valuation completed successfully!");
    } catch (error) {
      console.error('Error during valuation:', error);
      toast.error("Failed to get vehicle valuation. Please try entering details manually.", {
        action: {
          label: "Enter Manually",
          onClick: () => setShowManualForm(true)
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    setDialogOpen(false);
    navigate('/sell-my-car');
  };

  return {
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
  };
};