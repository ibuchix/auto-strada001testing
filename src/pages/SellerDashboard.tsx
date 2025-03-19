
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
 * - 2024-09-05: Further refactored to use new component structure and hooks
 * - 2024-09-08: Added auction results section to display completed auctions
 * - 2024-09-10: Added seller performance metrics section
 * - 2024-09-13: Replaced individual real-time subscriptions with comprehensive useRealtimeSubscriptions hook
 * - 2024-10-16: Updated to handle the new data format from useOptimizedQuery hooks
 * - 2024-11-11: Improved mobile layout by reducing excessive spacing
 */

import { useAuth } from "@/components/AuthProvider";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardLoading } from "@/components/dashboard/DashboardLoading";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { useSellerListings } from "@/hooks/useSellerListings";
import { useAuctionResults } from "@/hooks/useAuctionResults";
import { useSellerPerformance } from "@/hooks/useSellerPerformance";
import { useCallback } from "react";
import { useRealtimeSubscriptions } from "@/hooks/useRealtimeSubscriptions";
import { useIsMobile } from "@/hooks/use-mobile";

const SellerDashboard = () => {
  const { session } = useAuth();
  const isMobile = useIsMobile();
  const { 
    activeListings, 
    draftListings, 
    isLoading, 
    forceRefresh 
  } = useSellerListings(session);

  // Fetch auction results
  const {
    data: auctionResults,
    isLoading: isResultsLoading
  } = useAuctionResults(session);

  // Fetch seller performance metrics
  const {
    data: performanceMetrics,
    isLoading: isMetricsLoading
  } = useSellerPerformance(session);

  // Memoize the refresh callback to prevent unnecessary hook recreations
  const handleListingUpdate = useCallback(() => {
    forceRefresh();
  }, [forceRefresh]);

  // Setup real-time subscriptions for all seller-related events
  useRealtimeSubscriptions(session);

  // Conditionally apply spacing classes based on mobile vs desktop
  const containerClasses = isMobile 
    ? "container mx-auto px-4 py-6 mt-4" 
    : "container mx-auto px-4 py-20 mt-20";

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <div className={containerClasses}>
        <DashboardHeader title="Seller Dashboard" />

        {isLoading ? (
          <DashboardLoading />
        ) : (
          <DashboardContent 
            activeListings={activeListings}
            draftListings={draftListings}
            auctionResults={auctionResults || []}
            isResultsLoading={isResultsLoading}
            performanceMetrics={performanceMetrics || null}
            isMetricsLoading={isMetricsLoading}
            onRefresh={forceRefresh}
          />
        )}
      </div>
      <Footer />
    </div>
  );
};

export default SellerDashboard;
