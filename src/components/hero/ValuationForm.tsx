import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ValuationInput } from "./ValuationInput";
import { ValuationResult } from "./ValuationResult";
import { toast } from "sonner";

export const ValuationForm = () => {
  const [vin, setVin] = useState("");
  const [mileage, setMileage] = useState("");
  const [gearbox, setGearbox] = useState("manual");
  const [isLoading, setIsLoading] = useState(false);
  const [valuationResult, setValuationResult] = useState<any>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      // Check if VIN already exists
      const { data: existingCar } = await supabase
        .from('cars')
        .select('id')
        .eq('vin', vin)
        .maybeSingle();

      if (existingCar) {
        toast.error("This VIN number is already registered in our system");
        return;
      }

      const { data, error } = await supabase.functions.invoke('get-car-valuation', {
        body: { 
          vin,
          mileage: parseInt(mileage),
          gearbox 
        }
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.message || 'Failed to get valuation');
      }

      const valuationData = data.data;
      console.log('Received valuation data:', valuationData);

      const transformedResult = {
        make: valuationData.make,
        model: valuationData.model,
        year: valuationData.year,
        vin: valuationData.vin,
        mileage: parseInt(mileage),
        transmission: gearbox,
        valuation: valuationData.valuation || 0,
        timestamp: new Date().toISOString()
      };

      console.log('Transformed valuation data:', transformedResult);
      localStorage.setItem('valuationData', JSON.stringify(transformedResult));

      setValuationResult(transformedResult);
      toast.success("Valuation completed successfully!");
    } catch (error: any) {
      console.error('Valuation error:', error);
      toast.error(error.message || "Failed to get valuation");
      setValuationResult({ error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    navigate('/sell-my-car');
  };

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
        onSubmit={handleSubmit}
      />
      {valuationResult && !valuationResult.error && (
        <ValuationResult 
          valuationResult={valuationResult}
          onContinue={handleContinue}
        />
      )}
    </div>
  );
};