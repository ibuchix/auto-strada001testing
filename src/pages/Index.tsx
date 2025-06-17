
/**
 * Changes made:
 * - 2024-09-07: Added proper component implementation with default export
 * - 2024-09-08: Fixed export syntax to ensure proper module resolution
 * - 2024-03-28: Fixed component to ensure proper rendering
 * - 2025-05-05: Fixed IndexPage structure and added RealtimeProvider
 * - 2025-04-29: Removed unnecessary import causing nested provider issues
 * - 2025-05-01: Verified component is correctly exporting as default for routing
 * - 2025-05-21: Updated component to ensure it renders properly as root route
 * - 2025-05-22: Fixed navigation spacing to ensure hero section appears correctly
 * - 2025-05-24: Fixed layout and content rendering to resolve blank page issue
 * - 2025-06-17: Removed BottomCTA component completely as it's no longer needed
 */

import React, { useEffect } from 'react';
import { Hero } from '@/components/Hero';
import { HowItWorks } from '@/components/HowItWorks';
import { Benefits } from '@/components/Benefits';
import { Testimonials } from '@/components/Testimonials';
import { VerifiedDealers } from '@/components/VerifiedDealers';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

const IndexPage = () => {
  // Add log to verify component mounting
  useEffect(() => {
    console.log("IndexPage mounted");
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navigation />
      <main className="flex-grow">
        <Hero />
        <HowItWorks />
        <Benefits />
        <Testimonials />
        <VerifiedDealers />
      </main>
      <Footer />
    </div>
  );
};

export default IndexPage;
