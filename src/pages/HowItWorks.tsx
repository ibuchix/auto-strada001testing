import { Navigation } from "@/components/Navigation";
import { HowItWorks as HowItWorksSection } from "@/components/HowItWorks";
import { Footer } from "@/components/Footer";

const HowItWorks = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="mt-20">
        <HowItWorksSection />
      </div>
      <Footer />
    </div>
  );
};

export default HowItWorks;