
/**
 * Changes made:
 * - 2024-03-19: Initial implementation of listing card component
 * - 2024-03-19: Added support for draft and active states
 * - 2024-03-19: Implemented listing activation functionality
 * - 2024-09-07: Updated to work better with real-time updates
 * - 2025-05-08: Changed "Continue Editing" to "See Details" and improved activation error handling
 * - 2025-05-08: Updated to display reserve price from valuation data instead of price
 * - 2025-05-08: Fixed to use database reserve_price field, improved error handling and added better logging
 * - 2025-05-08: Added better error handling and detailed logging for activation issues
 * - 2025-05-08: Improved navigation to car details page
 * - 2025-05-19: Fixed reserve price calculation to prioritize database field over calculated value
 * - 2025-06-03: Enhanced activation functionality with better error handling and feedback
 * - 2025-06-22: Fixed TypeScript errors with sessionData and finalReservePrice variables
 * - 2025-06-27: Removed all fallback logic and database reserve_price usage to ensure consistency in pricing
 * - 2025-05-22: Refactored into smaller components with dedicated hooks
 * - 2025-06-01: Improved error handling for missing reserve price data, removed fallbacks
 */

import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useReservePrice } from "@/hooks/useReservePrice";
import { useListingActivation } from "@/hooks/useListingActivation";
import { ListingCardPrice } from "./ListingCardPrice";
import { ListingCardActions } from "./ListingCardActions";

interface ListingCardProps {
  id: string;
  title: string;
  price: number;
  status: string;
  isDraft: boolean;
  onStatusChange?: () => void;
  valuationData?: any;
}

export const ListingCard = ({ 
  id, 
  title, 
  price, 
  status, 
  isDraft, 
  onStatusChange,
  valuationData
}: ListingCardProps) => {
  const navigate = useNavigate();
  
  // Use our custom hooks
  const { reservePrice, isCalculating, error } = useReservePrice({ 
    valuationData 
  });
  
  const { isActivating, activateListing } = useListingActivation({
    onActivationSuccess: onStatusChange
  });

  const handleActivate = () => {
    activateListing(id, valuationData);
  };

  const viewDetails = () => {
    navigate(`/dashboard/car/${id}`);
  };

  return (
    <Card className="p-4 hover:bg-accent/5 transition-colors">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-lg">{title}</h3>
          <p className="text-subtitle text-sm">
            Status: <span className="capitalize">{isDraft ? 'Draft' : status}</span>
          </p>
          <ListingCardPrice 
            price={reservePrice} 
            isCalculating={isCalculating} 
          />
        </div>
        <ListingCardActions 
          isDraft={isDraft}
          isActivating={isActivating}
          canActivate={reservePrice !== null && !error}
          onActivate={handleActivate}
          onViewDetails={viewDetails}
        />
      </div>
    </Card>
  );
};
