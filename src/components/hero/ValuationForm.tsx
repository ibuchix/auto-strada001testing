import { useState } from "react";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { ValuationInput } from "./ValuationInput";
import { ValuationResult } from "./ValuationResult";

export const ValuationForm = () => {
  const [vin, setVin] = useState("");
  const [mileage, setMileage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [valuationResult, setValuationResult] = useState(null);
  const [showDialog, setShowDialog] = useState(false);

  const handleValuation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!vin) {
      toast.error("Please enter your vehicle's VIN number");
      return;
    }

    if (!mileage) {
      toast.error("Please enter your vehicle's mileage");
      return;
    }

    setIsLoading(true);

    try {
      const { data: valuationData, error: valuationError } = await supabase.functions.invoke('get-car-valuation', {
        body: { 
          registration: vin,
          mileage: parseInt(mileage)
        }
      });

      if (valuationError) {
        console.error('Valuation error:', valuationError);
        throw valuationError;
      }

      if (!valuationData) {
        throw new Error('No data received from valuation service');
      }

      console.log('Received valuation data:', valuationData);

      const valuationResult = {
        make: valuationData.make,
        model: valuationData.model,
        year: valuationData.year,
        vin: vin,
        valuation: valuationData.valuation || 0,
        transmission: valuationData.transmission || 'Not available',
        fuelType: valuationData.fuelType || 'Not available',
        timestamp: new Date().toISOString()
      };

      // Store in localStorage
      const previousValuations = JSON.parse(localStorage.getItem('carValuations') || '[]');
      previousValuations.unshift(valuationResult);
      localStorage.setItem('carValuations', JSON.stringify(previousValuations.slice(0, 5)));

      setValuationResult(valuationResult);
      setShowDialog(true);
      toast.success("Vehicle valuation completed successfully!");
      setVin("");
      setMileage("");
      
    } catch (error) {
      console.error('Valuation error:', error);
      toast.error(error.message || "Failed to get vehicle valuation");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ValuationInput
        vin={vin}
        mileage={mileage}
        isLoading={isLoading}
        onVinChange={setVin}
        onMileageChange={setMileage}
        onSubmit={handleValuation}
      />

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <ValuationResult valuationResult={valuationResult} />
      </Dialog>
    </>
  );
};