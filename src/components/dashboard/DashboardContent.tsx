
/**
 * Changes made:
 * - 2025-06-12: Completely redesigned dashboard to focus on seller journey
 * - Replaced generic stats with relevant listing status, live auctions, and bid results
 * - Removed irrelevant performance metrics and activity sections
 */

import { ListingStatusSection } from "./ListingStatusSection";
import { LiveAuctionsSection } from "./LiveAuctionsSection";
import { AuctionResultsSection } from "./AuctionResultsSection";
import { CarListing } from "@/types/dashboard";
import { AuctionResult } from "@/hooks/useAuctionResults";

interface DashboardContentProps {
  activeListings: CarListing[];
  draftListings: CarListing[];
  auctionResults: AuctionResult[];
  isResultsLoading: boolean;
  performanceMetrics: any;
  isMetricsLoading: boolean;
  onRefresh: () => void;
}

export const DashboardContent = ({ 
  activeListings,
  draftListings,
  auctionResults,
  isResultsLoading,
  onRefresh
}: DashboardContentProps) => {
  // Combine all listings for status display
  const allListings = [...activeListings, ...draftListings];
  
  return (
    <div className="space-y-12">
      {/* Listing Status Section - Top Priority */}
      <ListingStatusSection 
        listings={allListings}
        isLoading={false}
      />

      {/* Live Auctions Section - Current Action */}
      <LiveAuctionsSection 
        listings={activeListings}
        isLoading={false}
      />

      {/* Auction Results Section - Historical Data */}
      <AuctionResultsSection 
        results={auctionResults || []} 
        isLoading={isResultsLoading} 
      />
    </div>
  );
};
