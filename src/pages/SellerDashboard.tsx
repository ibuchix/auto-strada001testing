
/**
 * Changes made:
 * - 2024-03-26: Fixed TypeScript errors
 * - 2024-03-26: Updated to use session.user instead of user property
 * - 2024-03-26: Added proper handling for seller_notes field and optional fields
 * - 2024-03-26: Fixed type conflicts with CarListing interface
 * - 2024-03-28: Unified CarListing interface to avoid type conflicts
 * - 2024-03-28: Added explicit typing for data transformations
 * - 2024-07-03: Reorganized dashboard layout with distinct sections for active and draft listings
 * - 2024-07-03: Added DashboardStats and ActivitySection components
 * - 2024-07-05: Updated to handle seller profiles from the new sellers table
 * - 2024-08-22: Refactored into smaller components for better maintainability
 */

import { useAuth } from "@/components/AuthProvider";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardLoading } from "@/components/dashboard/DashboardLoading";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { useSellerListings } from "@/hooks/useSellerListings";

const SellerDashboard = () => {
  const { session } = useAuth();
  const { 
    activeListings, 
    draftListings, 
    isLoading, 
    forceRefresh 
  } = useSellerListings(session);

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <div className="container mx-auto px-4 py-20 mt-20">
        <DashboardHeader title="Seller Dashboard" />

        {isLoading ? (
          <DashboardLoading />
        ) : (
          <DashboardContent 
            activeListings={activeListings}
            draftListings={draftListings}
            onRefresh={forceRefresh}
          />
        )}
      </div>
      <Footer />
    </div>
  );
};

export default SellerDashboard;
