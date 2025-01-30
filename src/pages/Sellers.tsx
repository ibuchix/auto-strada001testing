import { Navigation } from "@/components/Navigation";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { HeroSection } from "@/components/sellers/HeroSection";
import { BenefitsSection } from "@/components/sellers/BenefitsSection";
import { getValuation } from "@/components/hero/valuation/services/valuationService";
import { useAuth } from "@/components/AuthProvider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Sellers = () => {
  const [vin, setVin] = useState("");
  const [mileage, setMileage] = useState("");
  const [gearbox, setGearbox] = useState("manual");
  const [isLoading, setIsLoading] = useState(false);
  const [showManualDialog, setShowManualDialog] = useState(false);
  const navigate = useNavigate();
  const { session } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!vin.trim()) {
      toast.error("Please enter a VIN number");
      return;
    }

    if (!mileage.trim()) {
      toast.error("Please enter your vehicle's mileage");
      return;
    }

    setIsLoading(true);

    try {
      const valuationData = await getValuation(
        vin,
        parseInt(mileage),
        gearbox
      );

      console.log('Valuation response:', valuationData);

      // Store the valuation data and form inputs
      if (valuationData && valuationData.make && valuationData.model) {
        localStorage.setItem('valuationData', JSON.stringify(valuationData));
        localStorage.setItem('tempVIN', vin);
        localStorage.setItem('tempMileage', mileage);
        localStorage.setItem('tempGearbox', gearbox);
        
        // Navigate to the listing form
        navigate('/sell-my-car');
        toast.success("Vehicle information found! Please complete your listing.");
      } else {
        // Show manual entry dialog if we don't have complete vehicle data
        setShowManualDialog(true);
      }
    } catch (error: any) {
      console.error('Error:', error);
      setShowManualDialog(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualEntry = () => {
    setShowManualDialog(false);
    navigate('/manual-valuation');
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <HeroSection 
        vin={vin}
        mileage={mileage}
        gearbox={gearbox}
        isLoading={isLoading}
        onVinChange={(e) => setVin(e.target.value)}
        onMileageChange={(e) => setMileage(e.target.value)}
        onGearboxChange={setGearbox}
        onSubmit={handleSubmit}
      />
      
      <BenefitsSection />

      <AlertDialog open={showManualDialog} onOpenChange={setShowManualDialog}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-dark font-kanit">Vehicle Information Required</AlertDialogTitle>
            <AlertDialogDescription className="text-subtitle">
              We need additional details about your vehicle. Would you like to enter them manually?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-accent text-dark">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleManualEntry}
              className="bg-primary text-white hover:bg-primary/90"
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Sellers;