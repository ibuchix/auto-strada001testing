
/**
 * Changes made:
 * - 2024-08-22: Created DashboardContent component from SellerDashboard refactoring
 */

import { ListingsSection } from "./ListingsSection";
import { DashboardStats } from "./DashboardStats";
import { ActivitySection } from "./ActivitySection";
import { CarListing } from "@/types/dashboard";

interface DashboardContentProps {
  activeListings: CarListing[];
  draftListings: CarListing[];
  onRefresh: () => void;
}

export const DashboardContent = ({ 
  activeListings,
  draftListings,
  onRefresh
}: DashboardContentProps) => {
  return (
    <div className="space-y-8">
      {/* Dashboard Stats Section */}
      <DashboardStats activeListings={activeListings.length} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Draft Listings Section */}
        {draftListings.length > 0 && (
          <div className="lg:col-span-2">
            <ListingsSection 
              listings={draftListings}
              onStatusChange={onRefresh} 
            />
          </div>
        )}
        
        {/* Active Listings Section */}
        <div className={draftListings.length > 0 ? "lg:col-span-1" : "lg:col-span-2"}>
          <ListingsSection 
            listings={activeListings} 
            onStatusChange={onRefresh}
          />
        </div>
        
        {/* Activity Section */}
        <div className="lg:col-span-1">
          <ActivitySection />
        </div>
      </div>
    </div>
  );
};
