import { Navigation } from "@/components/Navigation";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { HeroSection } from "@/components/sellers/HeroSection";
import { BenefitsSection } from "@/components/sellers/BenefitsSection";
import { md5 } from "js-md5";

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
      const API_ID = "AUTOSTRA";
      const API_SECRET = "A4FTFH54C3E37P2D34A16A7A4V41XKBF";
      const checksum = md5(API_ID + API_SECRET + vin);
      
      const valuationUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${API_ID}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/currency:PLN`;
      
      const response = await fetch(valuationUrl);
      
      if (!response.ok) {
        throw new Error('Failed to fetch valuation data');
      }
      
      const valuationData = await response.json();
      
      localStorage.setItem('valuationData', JSON.stringify(valuationData));
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