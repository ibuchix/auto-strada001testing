/**
 * Changes made:
 * - 2024-03-19: Initial implementation of listings section component
 * - 2024-03-19: Added support for empty state and listing cards
 * - 2024-03-19: Implemented status change handling
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListingCard } from "@/components/dashboard/ListingCard";
import { useNavigate } from "react-router-dom";

interface CarListing {
  id: string;
  title: string;
  description: string;
  price: number;
  status: string;
  created_at: string;
  make: string;
  model: string;
  year: number;
  is_draft: boolean;
  is_auction: boolean;
}

interface ListingsSectionProps {
  listings: CarListing[];
  onStatusChange: () => void;
}

export const ListingsSection = ({ listings, onStatusChange }: ListingsSectionProps) => {
  const navigate = useNavigate();

  return (
    <Card className="lg:col-span-2 bg-white shadow-md animate-fade-in [animation-delay:800ms]">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-dark">Your Listings</CardTitle>
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
                status={listing.status}
                isDraft={listing.is_draft}
                onStatusChange={onStatusChange}
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
              onClick={() => navigate('/sell-my-car')}
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
