
/**
 * Updated: 2024-09-08
 * Fixed Index page to restore the proper home page design
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
import { RealtimeProvider } from '@/components/RealtimeProvider';

const IndexPage = () => {
  return (
    <RealtimeProvider>
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
    </RealtimeProvider>
  );
};

export default IndexPage;
