
import { useAuth } from "@/components/AuthProvider";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ErrorDialog } from "./valuation/components/ErrorDialog";
import { ExistingVehicleDialog } from "./valuation/components/ExistingVehicleDialog";
import { ValuationContent } from "./valuation/components/ValuationContent";

interface ValuationResultProps {
  valuationResult: {
    make: string;
    model: string;
    year: number;
    vin: string;
    transmission: string;
    valuation?: number;
    averagePrice?: number;
    isExisting?: boolean;
    error?: string;
    rawResponse?: any;
  };
  onContinue: () => void;
  onClose: () => void;
  onRetry?: () => void;
}

export const ValuationResult = ({ 
  valuationResult, 
  onContinue, 
  onClose,
  onRetry 
}: ValuationResultProps) => {
  const { session } = useAuth();
  const navigate = useNavigate();
  
  if (!valuationResult) return null;

  const mileage = parseInt(localStorage.getItem('tempMileage') || '0');
  const hasError = !!valuationResult.error;
  const hasValuation = !hasError && (valuationResult.averagePrice || valuationResult.valuation);
  
  const averagePrice = valuationResult.averagePrice || 0;
  console.log('ValuationResult - Display price:', averagePrice);

  const handleContinue = async () => {
    if (!session) {
      navigate('/auth');
      return;
    }

    // Check user's role from the profiles table
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (error) {
      toast.error("Failed to verify user role");
      return;
    }

    if (profile.role !== 'seller') {
      navigate('/auth');
      toast.info("Please sign up as a seller to list your car");
      return;
    }

    // If they are a seller, handle the navigation based on VIN check result
    if (valuationResult.isExisting) {
      toast.error("This vehicle has already been listed");
      onClose();
    } else {
      navigate('/sell-my-car');
      localStorage.setItem('valuationData', JSON.stringify(valuationResult));
      localStorage.setItem('tempVIN', valuationResult.vin);
      localStorage.setItem('tempMileage', mileage.toString());
      localStorage.setItem('tempGearbox', valuationResult.transmission);
    }
  };

  if (hasError && valuationResult.isExisting) {
    return <ExistingVehicleDialog onClose={onClose} onRetry={onRetry} />;
  }

  if (hasError) {
    return (
      <ErrorDialog 
        error={valuationResult.error}
        onClose={onClose}
        onRetry={onRetry}
      />
    );
  }

  return (
    <ValuationContent
      make={valuationResult.make}
      model={valuationResult.model}
      year={valuationResult.year}
      vin={valuationResult.vin}
      transmission={valuationResult.transmission}
      mileage={mileage}
      averagePrice={averagePrice}
      hasValuation={hasValuation}
      isLoggedIn={!!session}
      onClose={onClose}
      onContinue={handleContinue}
    />
  );
};
