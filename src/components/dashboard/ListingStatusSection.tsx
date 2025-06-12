
/**
 * Listing Status Section Component
 * Created: 2025-06-12 - New section to show listing review status
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, XCircle, Eye } from "lucide-react";
import { CarListing } from "@/types/dashboard";

interface ListingStatusSectionProps {
  listings: CarListing[];
  isLoading: boolean;
}

export const ListingStatusSection = ({ listings, isLoading }: ListingStatusSectionProps) => {
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

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending_review':
        return {
          icon: Clock,
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          title: 'Under Review',
          description: 'Your listing is being reviewed by our team'
        };
      case 'available':
        return {
          icon: CheckCircle,
          color: 'bg-green-100 text-green-800 border-green-200',
          title: 'Approved & Live',
          description: 'Your listing is live and available for bidding'
        };
      case 'rejected':
        return {
          icon: XCircle,
          color: 'bg-red-100 text-red-800 border-red-200',
          title: 'Requires Changes',
          description: 'Please review feedback and resubmit'
        };
      default:
        return {
          icon: Eye,
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          title: 'Draft',
          description: 'Complete your listing to submit for review'
        };
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-dark">Listing Status Updates</h2>
      
      {listings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-dark mb-2">No listings yet</h3>
            <p className="text-subtitle">Submit your first listing to see status updates here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((listing) => {
            const statusInfo = getStatusInfo(listing.status || 'draft');
            const StatusIcon = statusInfo.icon;
            
            return (
              <Card key={listing.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge className={statusInfo.color}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusInfo.title}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">
                    {listing.year} {listing.make} {listing.model}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-subtitle mb-2">{statusInfo.description}</p>
                  <div className="text-sm text-muted-foreground">
                    Reserve: {listing.reserve_price?.toLocaleString()} PLN
                  </div>
                  {listing.created_at && (
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
