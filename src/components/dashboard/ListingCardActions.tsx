
/**
 * Listing Card Actions Component
 * Created: 2025-05-22
 * Purpose: Display action buttons for listing cards
 */

import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface ListingCardActionsProps {
  isDraft: boolean;
  isActivating: boolean;
  canActivate: boolean;
  onActivate: () => void;
  onViewDetails: () => void;
}

export const ListingCardActions = ({
  isDraft,
  isActivating,
  canActivate,
  onActivate,
  onViewDetails
}: ListingCardActionsProps) => {
  return (
    <div className="flex gap-2">
      {isDraft && (
        <Button 
          variant="default"
          size="sm"
          onClick={onActivate}
          disabled={isActivating || !canActivate}
          className="bg-[#21CA6F] hover:bg-[#21CA6F]/90"
        >
          {isActivating ? 'Activating...' : 'Activate Listing'}
        </Button>
      )}
      <Button 
        variant="outline"
        size="sm"
        onClick={onViewDetails}
        className="flex items-center gap-2"
      >
        {isDraft ? 'See Details' : 'View Listing'}
        <ExternalLink className="h-4 w-4" />
      </Button>
    </div>
  );
};
