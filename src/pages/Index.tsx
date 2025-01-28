import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { Benefits } from "@/components/Benefits";
import { VerifiedDealers } from "@/components/VerifiedDealers";
import { Testimonials } from "@/components/Testimonials";
import { BottomCTA } from "@/components/BottomCTA";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { AuctionStats } from "@/components/AuctionStats";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Hero />
      <AuctionStats carId="your-car-id-here" /> {/* Replace with actual car ID when available */}
      <HowItWorks />
      <Benefits />
      <VerifiedDealers />
      <Testimonials />
      <BottomCTA />
      <Footer />
    </div>
  );
};

export default Index;