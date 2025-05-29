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
 * - 2025-06-22: Improved RLS error handling using security definer RPC functions
 * - 2025-05-29: Updated destructuring to match new useSellerListings return properties
 * - 2025-05-29: REMOVED price and is_draft fields, added data transformation for compatibility
 * - 2025-05-29: Fixed Json to CarFeatures type conversion using safe casting through unknown
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
import { AuthErrorHandler } from "@/components/error-handling/AuthErrorHandler";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { RegistrationStatusCheck } from "@/components/auth/recovery/RegistrationStatusCheck";
import { CarListing } from "@/types/dashboard";
import { CarFeatures } from "@/types/forms";

const SellerDashboard = () => {
  const { session, refreshSellerStatus } = useAuth();
  const isMobile = useIsMobile();
  const { 
    listings, 
    loading, 
    error,
    isRlsError, 
    fetchListings 
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

  // Transform DbCarListing to CarListing format with safe type conversion
  const transformedListings: CarListing[] = listings.map(listing => ({
    ...listing,
    reserve_price: listing.reserve_price || 0,
    description: listing.seller_notes || `${listing.year} ${listing.make} ${listing.model}` || '',
    features: (listing.features as unknown) as CarFeatures | null, // Safe type casting through unknown
  }));

  // All listings are active now (no more drafts)
  const activeListings = transformedListings.filter(listing => listing.status === 'available');
  const draftListings: CarListing[] = []; // No more draft listings

  // Memoize the refresh callback to prevent unnecessary hook recreations
  const handleListingUpdate = useCallback(() => {
    fetchListings();
  }, [fetchListings]);

  // Handle RLS errors by refreshing seller status
  const handleRlsRetry = useCallback(async () => {
    if (!session) return;
    
    try {
      // Try the RPC function that bypasses RLS and doesn't need parameters
      const { data, error } = await supabase.rpc('ensure_seller_registration');
      
      if (error) {
        console.error("Failed to recover from RLS error using ensure_seller_registration:", error);
        
        // Fallback to register_seller RPC
        const { error: registerError } = await supabase.rpc('register_seller', {
          p_user_id: session.user.id
        });
        
        if (registerError) {
          console.error("Failed to recover using register_seller RPC:", registerError);
          throw registerError;
        }
      }
      
      // Refresh seller status in context
      await refreshSellerStatus();
      
      // Then refresh the listings
      fetchListings();
    } catch (error) {
      console.error("Failed to recover from RLS error:", error);
    }
  }, [session, refreshSellerStatus, fetchListings]);

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

        {loading ? (
          <DashboardLoading />
        ) : (
          <DashboardContent 
            activeListings={activeListings}
            draftListings={draftListings}
            auctionResults={auctionResults || []}
            isResultsLoading={isResultsLoading}
            performanceMetrics={performanceMetrics || null}
            isMetricsLoading={isMetricsLoading}
            onRefresh={fetchListings}
          />
        )}
      </div>
      <Footer />
    </div>
  );
};

export default SellerDashboard;
