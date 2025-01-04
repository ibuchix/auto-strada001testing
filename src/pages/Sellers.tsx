import { Navigation } from "@/components/Navigation";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { HeroSection } from "@/components/sellers/HeroSection";
import { BenefitsSection } from "@/components/sellers/BenefitsSection";
import { supabase } from "@/integrations/supabase/client";

const Sellers = () => {
  const [vin, setVin] = useState("");
  const [mileage, setMileage] = useState("");
  const [gearbox, setGearbox] = useState("manual");
  const navigate = useNavigate();

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

    try {
      // Call our Edge Function instead of the external API directly
      const { data, error } = await supabase.functions.invoke('get-car-valuation', {
        body: {
          vin: vin,
          mileage: parseInt(mileage)
        }
      });

      if (error) {
        console.error('Valuation error:', error);
        throw new Error(error.message);
      }

      console.log('Valuation response:', data);
      
      // Store the valuation data and form inputs
      localStorage.setItem('valuationData', JSON.stringify(data));
      localStorage.setItem('tempVIN', vin);
      localStorage.setItem('tempMileage', mileage);
      localStorage.setItem('tempGearbox', gearbox);
      
      navigate('/sell-my-car');
    } catch (error) {
      console.error('Error:', error);
      toast.error("Failed to get vehicle valuation. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <HeroSection 
        vin={vin}
        mileage={mileage}
        gearbox={gearbox}
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