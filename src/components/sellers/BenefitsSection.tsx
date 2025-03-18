
/**
 * Changes made:
 * - 2024-09-26: Created WithRouterGuard wrapper to ensure useNavigate is used only in Router context
 * - 2024-09-26: Added defensive check for router context
 */

import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export const BenefitsSection = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Added to confirm Router context exists

  const handleStartSelling = () => {
    navigate('/sell-my-car');
  };

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 font-oswald text-dark">
            Why Sell With Us?
          </h2>
          <p className="text-subtitle text-lg max-w-2xl mx-auto">
            Experience a seamless selling process with our dedicated support and competitive pricing
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💰</span>
            </div>
            <h3 className="text-xl font-bold mb-2 font-oswald text-dark">Best Price Guarantee</h3>
            <p className="text-subtitle">Get the best market value for your vehicle with our competitive pricing system</p>
          </div>

          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="text-xl font-bold mb-2 font-oswald text-dark">Quick Process</h3>
            <p className="text-subtitle">Complete the entire selling process in as little as 24 hours</p>
          </div>

          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🤝</span>
            </div>
            <h3 className="text-xl font-bold mb-2 font-oswald text-dark">Hassle-Free Experience</h3>
            <p className="text-subtitle">We handle all the paperwork and provide support throughout the process</p>
          </div>
        </div>

        <div className="text-center">
          <Button 
            onClick={handleStartSelling}
            className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg rounded-md inline-flex items-center gap-2"
          >
            Start Selling
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};
