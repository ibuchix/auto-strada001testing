import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { ErrorDialog } from "./valuation/components/ErrorDialog";
import { VehicleDetails } from "./valuation/components/VehicleDetails";
import { ValuationDisplay } from "./valuation/components/ValuationDisplay";
import { useAuth } from "@/components/AuthProvider";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

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
    return (
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center mb-4 flex items-center justify-center gap-2">
            <AlertCircle className="h-6 w-6 text-[#DC143C]" />
            Vehicle Already Listed
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-center">
          <p className="text-subtitle">
            This vehicle has already been listed in our system. Each vehicle can only be listed once.
          </p>
          <div className="bg-accent/50 p-4 rounded-lg">
            <p className="text-sm text-subtitle">
              If you believe this is an error or need assistance, please contact our support team.
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6">
          <Button 
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Close
          </Button>
          {onRetry && (
            <Button 
              onClick={onRetry}
              className="w-full sm:w-auto bg-[#DC143C] hover:bg-[#DC143C]/90 text-white"
            >
              Try Different VIN
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    );
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
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold text-center mb-6">
          {valuationResult.isExisting 
            ? "Similar Vehicle Found!" 
            : "Your Vehicle Valuation"
          }
        </DialogTitle>
      </DialogHeader>

      {valuationResult.isExisting && (
        <div className="bg-accent/50 p-4 rounded-lg mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
            <p className="text-sm text-subtitle">
              We found a similar vehicle in our system. Based on this, here's an estimated valuation for your car. Would you like to list yours?
            </p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <VehicleDetails 
          make={valuationResult.make}
          model={valuationResult.model}
          year={valuationResult.year}
          vin={valuationResult.vin}
          transmission={valuationResult.transmission}
          mileage={mileage}
        />

        {hasValuation && (
          <ValuationDisplay averagePrice={averagePrice} />
        )}
      </div>

      <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6">
        <Button 
          variant="outline"
          onClick={onClose}
          className="w-full sm:w-auto"
        >
          Close
        </Button>
        <Button 
          onClick={handleContinue}
          className="w-full sm:w-auto bg-secondary hover:bg-secondary/90 text-white"
        >
          {!session 
            ? "Sign Up to List Your Car" 
            : valuationResult.isExisting 
              ? "List My Car" 
              : "List This Car"
          }
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};