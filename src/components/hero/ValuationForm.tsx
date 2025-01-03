import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ValuationInput } from "./ValuationInput";
import { ValuationResult } from "./ValuationResult";

export const ValuationForm = () => {
  const [vin, setVin] = useState("");
  const [loading, setLoading] = useState(false);
  const [valuationResult, setValuationResult] = useState<any>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!vin.trim()) {
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-car-valuation', {
        body: { vin }
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.message || 'Failed to get valuation');
      }

      const valuationData = data.data;
      console.log('Received valuation data:', valuationData);

      // Store the valuation data in localStorage
      const gearbox = valuationData.gearbox?.toLowerCase() === 'automatic' ? 'automatic' : 'manual';

      const transformedResult = {
        make: valuationData.make,
        model: valuationData.model,
        year: valuationData.year,
        vin: valuationData.vin,
        mileage: valuationData.mileage,
        transmission: gearbox,
        valuation: valuationData.valuation || 0,
        timestamp: new Date().toISOString()
      };

      console.log('Transformed valuation data:', transformedResult);
      localStorage.setItem('valuationData', JSON.stringify(transformedResult));

      setValuationResult(transformedResult);
    } catch (error: any) {
      console.error('Valuation error:', error);
      setValuationResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    navigate('/sell-my-car');
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <ValuationInput 
        vin={vin}
        onChange={setVin}
        onSubmit={handleSubmit}
        loading={loading}
      />
      {valuationResult && (
        <ValuationResult 
          result={valuationResult}
          onContinue={handleContinue}
        />
      )}
    </div>
  );
};