
/**
 * Changes made:
 * - 2024-09-05: Created DashboardContent component from SellerDashboard refactoring
 * - 2024-09-08: Added AuctionResultsSection to display auction results
 * - 2024-09-10: Added PerformanceMetricsSection to display seller performance metrics
 * - 2024-09-22: Fixed import for AuctionResult interface
 * - 2024-09-23: Fixed array typing for empty arrays
 */

import { ListingsSection } from "./ListingsSection";
import { DashboardStats } from "./DashboardStats";
import { ActivitySection } from "./ActivitySection";
import { AuctionResultsSection } from "./AuctionResultsSection";
import { PerformanceMetricsSection } from "./PerformanceMetricsSection";
import { CarListing } from "@/types/dashboard";
import { AuctionResult } from "@/hooks/useAuctionResults";
import { SellerPerformanceMetrics } from "@/hooks/useSellerPerformance";

interface DashboardContentProps {
  activeListings: CarListing[];
  draftListings: CarListing[];
  auctionResults: AuctionResult[];
  isResultsLoading: boolean;
  performanceMetrics: SellerPerformanceMetrics | null;
  isMetricsLoading: boolean;
  onRefresh: () => void;
}

export const DashboardContent = ({ 
  activeListings,
  draftListings,
  auctionResults,
  isResultsLoading,
  performanceMetrics,
  isMetricsLoading,
  onRefresh
}: DashboardContentProps) => {
  return (
    <div className="space-y-8">
      {/* Dashboard Stats Section */}
      <DashboardStats activeListings={activeListings.length} />

      {/* Performance Metrics Section */}
      <PerformanceMetricsSection 
        metrics={performanceMetrics} 
        isLoading={isMetricsLoading} 
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Draft Listings Section */}
        {draftListings.length > 0 && (
          <div className="lg:col-span-2">
            <ListingsSection 
              listings={draftListings}
              onStatusChange={onRefresh}
              title="Draft Listings" 
            />
          </div>
        )}
        
        {/* Active Listings Section */}
        <div className={draftListings.length > 0 ? "lg:col-span-1" : "lg:col-span-2"}>
          <ListingsSection 
            listings={activeListings} 
            onStatusChange={onRefresh}
            title="Active Listings"
          />
        </div>
        
        {/* Activity Section */}
        <div className="lg:col-span-1">
          <ActivitySection />
        </div>
      </div>

      {/* Auction Results Section */}
      <div className="mt-8">
        <AuctionResultsSection 
          results={auctionResults} 
          isLoading={isResultsLoading} 
        />
      </div>
    </div>
  );
};
