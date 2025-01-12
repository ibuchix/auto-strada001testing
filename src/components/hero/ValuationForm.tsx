import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ValuationInput } from "./ValuationInput";
import { ValuationResult } from "./ValuationResult";
import { Dialog } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ManualValuationForm, ManualValuationData } from "./ManualValuationForm";

export const ValuationForm = () => {
  const [vin, setVin] = useState("");
  const [mileage, setMileage] = useState("");
  const [gearbox, setGearbox] = useState("manual");
  const [isLoading, setIsLoading] = useState(false);
  const [valuationResult, setValuationResult] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const navigate = useNavigate();

  const handleManualSubmit = async (data: ManualValuationData) => {
    console.log('Starting manual valuation with data:', data);
    setIsLoading(true);

    try {
      console.log('Making manual valuation request with:', {
        make: data.make,
        model: data.model,
        year: data.year,
        mileage: data.mileage,
        transmission: data.transmission,
      });

      const { data: response, error } = await supabase.functions.invoke('get-car-valuation', {
        body: { 
          make: data.make,
          model: data.model,
          year: parseInt(data.year),
          mileage: parseInt(data.mileage),
          gearbox: data.transmission,
          isManualEntry: true
        }
      });

      console.log('Manual valuation response:', response);

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

  const handleSubmit = async (e: React.FormEvent) => {
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
      const { data: publishedCar } = await supabase
        .from('cars')
        .select('id')
        .eq('vin', vin)
        .eq('is_draft', false)
        .maybeSingle();

      if (publishedCar) {
        toast.error("This VIN number is already registered in our system");
        setIsLoading(false);
        return;
      }

      console.log('Making VIN valuation request');
      const { data, error } = await supabase.functions.invoke('get-car-valuation', {
        body: { 
          vin: vin.trim(),
          mileage: parseInt(mileage),
          gearbox 
        }
      });

      console.log('VIN valuation response:', data);

      if (error) {
        console.error('VIN valuation error:', error);
        toast.error("Could not find vehicle with this VIN. Would you like to enter details manually?", {
          action: {
            label: "Enter Manually",
            onClick: () => {
              console.log('Manual entry requested');
              setShowManualForm(true);
            }
          },
        });
        return;
      }

      if (!data?.success) {
        console.error('VIN valuation failed:', data);
        toast.error("Could not find vehicle with this VIN. Would you like to enter details manually?", {
          action: {
            label: "Enter Manually",
            onClick: () => {
              console.log('Manual entry requested after unsuccessful VIN lookup');
              setShowManualForm(true);
            }
          },
        });
        return;
      }

      const valuationData = data.data;
      console.log('Storing valuation data:', valuationData);

      localStorage.setItem('valuationData', JSON.stringify(valuationData));
      localStorage.setItem('tempVIN', vin);
      localStorage.setItem('tempMileage', mileage);
      localStorage.setItem('tempGearbox', gearbox);

      setValuationResult(valuationData);
      setDialogOpen(true);
      toast.success("Valuation completed successfully!");
    } catch (error) {
      console.error('Error:', error);
      toast.error("Could not find vehicle with this VIN. Would you like to enter details manually?", {
        action: {
          label: "Enter Manually",
          onClick: () => {
            console.log('Manual entry requested after error');
            setShowManualForm(true);
          }
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    setDialogOpen(false);
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
        onClose={() => {
          console.log('Closing manual form');
          setShowManualForm(false);
          setIsLoading(false);
        }}
        onSubmit={handleManualSubmit}
        mileage={mileage}
        transmission={gearbox}
      />
    </div>
  );
};