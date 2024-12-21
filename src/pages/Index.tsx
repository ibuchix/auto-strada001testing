import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { Benefits } from "@/components/Benefits";
import { HowItWorks } from "@/components/HowItWorks";
import { VerifiedDealers } from "@/components/VerifiedDealers";
import { Testimonials } from "@/components/Testimonials";
import { BottomCTA } from "@/components/BottomCTA";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <Hero />
      <Benefits />
      <HowItWorks />
      <VerifiedDealers />
      <Testimonials />
      <BottomCTA />
      <Footer />
    </div>
  );
};

export default Index;