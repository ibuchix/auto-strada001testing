
/**
 * Changes made:
 * - 2024-09-05: Created ListingsSection component from SellerDashboard refactoring
 * - 2024-10-19: Updated "Create New Listing" button to navigate to homepage for VIN check
 * - 2025-05-08: Added valuation_data prop to ListingCard
 * - 2025-05-08: Added reserve_price prop to ListingCard
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListingCard } from "@/components/dashboard/ListingCard";
import { useNavigate } from "react-router-dom";
import { CarListing } from "@/types/dashboard";

interface ListingsSectionProps {
  listings: CarListing[];
  onStatusChange: () => void;
  title?: string;
}

export const ListingsSection = ({ 
  listings, 
  onStatusChange,
  title = "Your Listings"
}: ListingsSectionProps) => {
  const navigate = useNavigate();

  return (
    <Card className="bg-white shadow-md animate-fade-in [animation-delay:800ms]">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-dark">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {listings.length > 0 ? (
          <div className="space-y-4">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                id={listing.id}
                title={`${listing.year} ${listing.make} ${listing.model}`}
                price={listing.price}
                status={listing.status || ''}
                isDraft={listing.is_draft}
                onStatusChange={onStatusChange}
                valuationData={listing.valuation_data}
                reserve_price={listing.reserve_price}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Car className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-dark mb-2">No listings yet</h3>
            <p className="text-subtitle max-w-sm mb-4">
              Start listing your vehicles to receive bids from potential buyers.
            </p>
            <Button 
              onClick={() => navigate('/')}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              Create New Listing
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
