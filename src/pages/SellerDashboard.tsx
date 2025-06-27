
/**
 * Changes made:
 * - 2025-06-12: Redesigned dashboard to focus on seller journey (status → auctions → results)
 * - Removed irrelevant generic stats and performance metrics
 * - Streamlined to show what matters: listing status, live auctions, bid results
 */

import { useAuth } from "@/components/AuthProvider";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardLoading } from "@/components/dashboard/DashboardLoading";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { useSellerListings } from "@/hooks/useSellerListings";
import { useAuctionResults } from "@/hooks/useAuctionResults";
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

  // Transform DbCarListing to CarListing format with safe type conversion
  const transformedListings: CarListing[] = listings.map(listing => ({
    ...listing,
    reserve_price: listing.reserve_price || 0,
    description: listing.seller_notes || `${listing.year} ${listing.make} ${listing.model}` || '',
    features: (listing.features as unknown) as CarFeatures | null,
  }));

  // All listings are active now (no more drafts)
  const activeListings = transformedListings.filter(listing => listing.status === 'available');
  const draftListings: CarListing[] = [];

  // Memoize the refresh callback to prevent unnecessary hook recreations
  const handleListingUpdate = useCallback(() => {
    fetchListings();
  }, [fetchListings]);

  // Handle RLS errors by refreshing seller status
  const handleRlsRetry = useCallback(async () => {
    if (!session) return;
    
    try {
      const { data, error } = await supabase.rpc('ensure_seller_registration');
      
      if (error) {
        console.error("Failed to recover from RLS error using ensure_seller_registration:", error);
        
        const { error: registerError } = await supabase.rpc('register_seller', {
          p_user_id: session.user.id
        });
        
        if (registerError) {
          console.error("Failed to recover using register_seller RPC:", registerError);
          throw registerError;
        }
      }
      
      await refreshSellerStatus();
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
            performanceMetrics={null}
            isMetricsLoading={false}
            onRefresh={fetchListings}
          />
        )}
      </div>
      <Footer />
    </div>
  );
};

export default SellerDashboard;
