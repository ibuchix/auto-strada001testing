
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { Benefits } from "@/components/Benefits";
import { VerifiedDealers } from "@/components/VerifiedDealers";
import { Testimonials } from "@/components/Testimonials";
import { BottomCTA } from "@/components/BottomCTA";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

export default function Index() {
  return (
    <main className="min-h-screen bg-[#FFFFFF]">
      <Navigation />
      <Hero />
      <HowItWorks />
      <Benefits />
      <VerifiedDealers />
      <Testimonials />
      <BottomCTA />
      <Footer />
    </main>
  );
}
