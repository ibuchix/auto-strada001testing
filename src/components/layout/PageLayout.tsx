
/**
 * Changes made:
 * - 2025-07-14: Created reusable layout component with navigation and footer
 * - 2025-05-20: Updated padding to ensure content doesn't overlap with navbar
 */

import React from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const PageLayout = ({ children, className = "" }: PageLayoutProps) => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <div className={`container mx-auto px-4 pt-24 pb-20 ${className}`}>
        {children}
      </div>
      <Footer />
    </div>
  );
};
