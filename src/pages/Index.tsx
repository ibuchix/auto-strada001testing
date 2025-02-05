
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { Benefits } from "@/components/Benefits";
import { VerifiedDealers } from "@/components/VerifiedDealers";
import { Testimonials } from "@/components/Testimonials";
import { BottomCTA } from "@/components/BottomCTA";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      <main className="flex-grow">
        <Hero />
        <HowItWorks />
        <Benefits />
        <VerifiedDealers />
        <Testimonials />
        <BottomCTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
