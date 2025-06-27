
/**
 * Live Auctions Section Component
 * Created: 2025-06-12 - Shows cars currently at auction
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gavel, Users, Timer } from "lucide-react";
import { CarListing } from "@/types/dashboard";
import { formatDistanceToNow } from "date-fns";

interface LiveAuctionsSectionProps {
  listings: CarListing[];
  isLoading: boolean;
}

export const LiveAuctionsSection = ({ listings, isLoading }: LiveAuctionsSectionProps) => {
  // Filter for listings that are currently at auction
  const liveAuctions = listings.filter(listing => 
    listing.status === 'available' && 
    listing.auction_status === 'active' &&
    listing.auction_end_time
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cars at Auction</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse text-muted-foreground">Loading auction data...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-dark">Cars at Auction</h2>
      
      {liveAuctions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Gavel className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-dark mb-2">No active auctions</h3>
            <p className="text-subtitle">When your approved listings go to auction, they'll appear here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {liveAuctions.map((listing) => {
            const timeRemaining = listing.auction_end_time 
              ? formatDistanceToNow(new Date(listing.auction_end_time), { addSuffix: true })
              : 'Time not set';
            
            const currentBid = listing.current_bid || 0;
            const reserveMet = currentBid >= (listing.reserve_price || 0);
            
            return (
              <Card key={listing.id} className="border-l-4 border-l-primary">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <Gavel className="h-3 w-3 mr-1" />
                      Live Auction
                    </Badge>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Timer className="h-4 w-4 mr-1" />
                      {timeRemaining}
                    </div>
                  </div>
                  <CardTitle className="text-xl">
                    {listing.year} {listing.make} {listing.model}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Current Bid</p>
                      <p className="text-2xl font-bold text-primary">
                        {currentBid > 0 ? `${currentBid.toLocaleString()} PLN` : 'No bids yet'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Reserve Price</p>
                      <p className="text-lg font-semibold">
                        {listing.reserve_price?.toLocaleString()} PLN
                      </p>
                      <Badge 
                        variant={reserveMet ? "default" : "secondary"}
                        className={reserveMet ? "bg-green-100 text-green-800" : ""}
                      >
                        {reserveMet ? "Reserve Met" : "Reserve Not Met"}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="h-4 w-4 mr-1" />
                      Bidders watching
                    </div>
                    <Badge variant="outline">
                      View Auction
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
