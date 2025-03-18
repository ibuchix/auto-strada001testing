
/**
 * Changes made:
 * - 2024-09-07: Added proper component implementation with default export
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

// Note: The following SQL needs to be run in Supabase for real-time functionality:
// -- Enable replication identity for cars table to get old records in change events
// ALTER TABLE cars REPLICA IDENTITY FULL;
// -- Make sure the cars table is in the realtime publication
// ALTER PUBLICATION supabase_realtime ADD TABLE cars;

const Index = () => {
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

export default Index;
