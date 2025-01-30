import { Navigation } from "@/components/Navigation";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { BenefitsSection } from "@/components/sellers/BenefitsSection";
import { SellerWizard } from "@/components/sellers/wizard/SellerWizard";
import { getValuation } from "@/components/hero/valuation/services/valuationService";
import { useAuth } from "@/components/AuthProvider";

const Sellers = () => {
  const navigate = useNavigate();
  const { session } = useAuth();

  const handleSubmit = async (formData: any) => {
    try {
      const valuationData = await getValuation(
        formData.vin,
        parseInt(formData.mileage),
        formData.gearbox
      );

      // Store the valuation data and form inputs
      localStorage.setItem('valuationData', JSON.stringify(valuationData));
      localStorage.setItem('tempVIN', formData.vin);
      localStorage.setItem('tempMileage', formData.mileage);
      localStorage.setItem('tempGearbox', formData.gearbox);
      
      navigate('/sell-my-car');
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || "Failed to get vehicle valuation. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <div className="pt-32 pb-16">
        <div className="container mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-center mb-12">
            Sell your car in <span className="text-primary">3 simple steps</span>
          </h1>
          
          <SellerWizard onSubmit={handleSubmit} />
        </div>
      </div>
      
      <BenefitsSection />
    </div>
  );
};

export default Sellers;