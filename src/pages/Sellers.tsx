import { Navigation } from "@/components/Navigation";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { HeroSection } from "@/components/sellers/HeroSection";
import { BenefitsSection } from "@/components/sellers/BenefitsSection";
import { getValuation } from "@/components/hero/valuation/services/valuationService";
import { useAuth } from "@/components/AuthProvider";

const Sellers = () => {
  const [vin, setVin] = useState("");
  const [mileage, setMileage] = useState("");
  const [gearbox, setGearbox] = useState("manual");
  const [isLoading, setIsLoading] = useState(false);
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

      // Store the valuation data and form inputs
      localStorage.setItem('valuationData', JSON.stringify(valuationData));
      localStorage.setItem('tempVIN', vin);
      localStorage.setItem('tempMileage', mileage);
      localStorage.setItem('tempGearbox', gearbox);
      
      // Check if the valuation data is incomplete or not found
      if (!valuationData || (!valuationData.make && !valuationData.model)) {
        const proceed = window.confirm(
          "We couldn't find detailed information for this VIN number in our database. " +
          "You can still proceed with listing your car, but you'll need to enter the vehicle details manually. " +
          "Would you like to continue?"
        );
        
        if (proceed) {
          navigate('/manual-valuation');
        }
        return;
      }
      
      navigate('/sell-my-car');
    } catch (error: any) {
      console.error('Error:', error);
      
      // If the API returns a specific "no data" error
      if (error.message?.includes('no data found') || error.message?.includes('not found')) {
        const proceed = window.confirm(
          "We couldn't find this VIN number in our database. " +
          "You can still proceed with listing your car, but you'll need to enter the vehicle details manually. " +
          "Would you like to continue?"
        );
        
        if (proceed) {
          navigate('/manual-valuation');
        }
      } else {
        toast.error(error.message || "Failed to get vehicle valuation. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
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
    </div>
  );
};

export default Sellers;