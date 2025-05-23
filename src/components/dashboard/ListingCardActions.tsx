
/**
 * Listing Card Actions Component
 * Created: 2025-05-22
 * Purpose: Display action buttons for listing card
 * Updated: 2025-06-01 - Added improved error handling for activation
 */

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

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
    <div className="flex flex-col gap-2">
      {isDraft && (
        <Button
          variant="default"
          size="sm"
          onClick={onActivate}
          disabled={isActivating || !canActivate}
        >
          {isActivating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Activating
            </>
          ) : (
            'Activate'
          )}
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={onViewDetails}
      >
        See Details
      </Button>
    </div>
  );
};
