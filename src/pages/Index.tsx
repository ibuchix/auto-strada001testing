
/**
 * Changes made:
 * - 2024-09-07: Added proper component implementation with default export
 * - 2024-09-08: Fixed export syntax to ensure proper module resolution
 * - 2024-03-28: Fixed component to ensure proper rendering
 * - 2025-05-05: Fixed IndexPage structure and added RealtimeProvider
 * - 2025-04-29: Removed unnecessary import causing nested provider issues
 */

import React from 'react';
import { Hero } from '@/components/Hero';
import { HowItWorks } from '@/components/HowItWorks';
import { Benefits } from '@/components/Benefits';
import { Testimonials } from '@/components/Testimonials';
import { BottomCTA } from '@/components/BottomCTA';
import { VerifiedDealers } from '@/components/VerifiedDealers';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

const IndexPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <Hero />
      <HowItWorks />
      <Benefits />
      <Testimonials />
      <VerifiedDealers />
      <BottomCTA />
      <Footer />
    </div>
  );
};

export default IndexPage;
