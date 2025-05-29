
/**
 * Changes made:
 * - 2025-05-23: Removed is_draft filtering, all listings are immediately available
 * - Simplified listing display without draft/active separation
 * - 2025-05-29: Updated to use reserve_price instead of price field
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
                reserve_price={listing.reserve_price} // Updated to use reserve_price
                status={listing.status || 'available'}
                onStatusChange={onStatusChange}
                valuationData={listing.valuation_data}
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
