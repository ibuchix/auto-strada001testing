
/**
 * Changes made:
 * - 2024-10-28: Updated to support valuation form being shown based on route state
 */

import { useState, useEffect } from "react";
import { Navigation } from "../components/Navigation";
import { Hero } from "../components/Hero";
import { HowItWorks } from "../components/HowItWorks";
import { Benefits } from "../components/Benefits";
import { Testimonials } from "../components/Testimonials";
import { VerifiedDealers } from "../components/VerifiedDealers";
import { BottomCTA } from "../components/BottomCTA";
import { Footer } from "../components/Footer";
import { useLocation } from "react-router-dom";

function IndexPage() {
  const location = useLocation();
  const [showValuation, setShowValuation] = useState(false);
  const [valuationContext, setValuationContext] = useState<'home' | 'seller'>('home');
  
  // Check for state from navigation (e.g., from seller dashboard)
  useEffect(() => {
    if (location.state?.showValuationForm) {
      setShowValuation(true);
      if (location.state?.valuationContext === 'seller') {
        setValuationContext('seller');
      }
    }
  }, [location.state]);

  return (
    <div className="bg-white">
      <Navigation />
      <Hero showValuationForm={showValuation} valuationContext={valuationContext} />
      <HowItWorks />
      <Benefits />
      <Testimonials />
      <VerifiedDealers />
      <BottomCTA />
      <Footer />
    </div>
  );
}

export default IndexPage;
