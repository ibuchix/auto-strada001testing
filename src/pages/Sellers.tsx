
import { Navigation } from "@/components/Navigation";
import { HeroSection } from "@/components/sellers/HeroSection";
import { BenefitsSection } from "@/components/sellers/BenefitsSection";

const Sellers = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <HeroSection />
      <BenefitsSection />
    </div>
  );
};

export default Sellers;
