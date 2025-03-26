
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
 * - 2024-11-21: Added RLS error handling with helpful user guidance
 * - 2025-06-12: Fixed TypeScript error with DashboardHeader props
 * - 2025-08-17: Enhanced RLS error handling to prevent dashboard blinking
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
import { useCallback, useEffect, useState } from "react";
import { useRealtimeSubscriptions } from "@/hooks/useRealtimeSubscriptions";
import { useIsMobile } from "@/hooks/use-mobile";
import { AuthErrorHandler } from "@/components/error-handling/AuthErrorHandler";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { sellerProfileService } from "@/services/supabase";
import { RegistrationStatusCheck } from "@/components/auth/recovery/RegistrationStatusCheck";
import { useNavigate } from "react-router-dom";

const SellerDashboard = () => {
  const { session, refreshSellerStatus, isSeller } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [retryAttempted, setRetryAttempted] = useState(false);
  
  const { 
    activeListings, 
    draftListings, 
    isLoading, 
    error,
    isRlsError, 
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

  // Auto-redirect to repair page if RLS error is detected and retry was attempted
  useEffect(() => {
    if (isRlsError && retryAttempted) {
      navigate('/seller-registration-repair');
    }
  }, [isRlsError, retryAttempted, navigate]);

  // Memoize the refresh callback to prevent unnecessary hook recreations
  const handleListingUpdate = useCallback(() => {
    forceRefresh();
  }, [forceRefresh]);

  // Handle RLS errors by refreshing seller status
  const handleRlsRetry = useCallback(async () => {
    if (!session) return;
    
    try {
      // Mark that we attempted a retry to prevent endless retries
      setRetryAttempted(true);
      
      // Try to register as seller (fixes common RLS issues)
      await sellerProfileService.registerSeller(session.user.id);
      
      // Refresh seller status in context
      await refreshSellerStatus();
      
      // Then refresh the listings
      forceRefresh();
    } catch (error) {
      console.error("Failed to recover from RLS error:", error);
      // Navigate to the repair page after a short delay
      setTimeout(() => {
        navigate('/seller-registration-repair');
      }, 500);
    }
  }, [session, refreshSellerStatus, forceRefresh, navigate]);

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
        
        {/* Add the registration status check */}
        <RegistrationStatusCheck />
        
        {/* Display RLS errors with recovery options */}
        {isRlsError && (
          <AuthErrorHandler 
            error={error}
            onRetry={handleRlsRetry}
            showSignIn={false}
            isRlsError={true}
          />
        )}
        
        {/* Display general errors */}
        {error && !isRlsError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error loading listings</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

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
