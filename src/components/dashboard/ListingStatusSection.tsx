
/**
 * Listing Status Section Component
 * 2025-06-15: Enhanced to show the true car journey/lifecycle with real-time status info.
 * Created: 2025-06-12 - New section to show listing review status
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CarListing } from "@/types/dashboard";
import { getListingLifecycleStatus } from "./listingStatusHelpers";

// Remove direct Lucide icon imports; handled by helper

interface ListingStatusSectionProps {
  listings: CarListing[];
  isLoading: boolean;
}

export const ListingStatusSection = ({
  listings,
  isLoading
}: ListingStatusSectionProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Listing Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse text-muted-foreground">Loading listing status...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {listings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            {/* We'll just re-use status icon from helper for full, but only if needed */}
            <svg className="h-16 w-16 text-gray-300 mb-4" fill="none"></svg>
            <h3 className="text-xl font-semibold text-dark mb-2">No listings yet</h3>
            <p className="text-subtitle">Submit your first listing to see status updates here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((listing) => {
            const status = getListingLifecycleStatus(listing);
            const StatusIcon = status.icon;

            return (
              <Card key={listing.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge className={status.color}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {status.title}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">
                    {listing.year} {listing.make} {listing.model}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-subtitle mb-2">{status.description}</p>
                  {typeof listing.reserve_price === "number" && listing.reserve_price > 0 && (
                    <div className="text-sm text-muted-foreground">
                      Reserve: {listing.reserve_price.toLocaleString()} PLN
                    </div>
                  )}
                  {listing.current_bid != null && typeof listing.current_bid === "number" && listing.current_bid > 0 && (
                    <div className="text-xs text-muted-foreground mt-2">
                      Current Bid: {listing.current_bid.toLocaleString()} PLN
                    </div>
                  )}
                  {listing.auction_end_time && (
                    <div className="text-xs text-muted-foreground mt-2">
                      Auction Ends: {new Date(listing.auction_end_time).toLocaleString()}
                    </div>
                  )}
                  {listing.created_at && !listing.auction_status && (
                    <div className="text-xs text-muted-foreground mt-2">
                      Submitted {new Date(listing.created_at).toLocaleDateString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
