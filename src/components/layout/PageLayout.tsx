
/**
 * Changes made:
 * - 2025-07-14: Created reusable layout component with navigation and footer
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
      <div className={`container mx-auto px-4 py-20 mt-20 ${className}`}>
        {children}
      </div>
      <Footer />
    </div>
  );
};
