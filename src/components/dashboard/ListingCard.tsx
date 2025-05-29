
/**
 * Changes made:
 * - 2025-05-23 - Removed is_draft system, all listings are immediately available
 * - Removed activation functionality and draft status handling
 * - Simplified to show only listing details and navigation
 * - 2025-05-29 - Updated to use reserve_price instead of price field
 */

import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useReservePrice } from "@/hooks/useReservePrice";
import { ListingCardPrice } from "./ListingCardPrice";
import { Button } from "@/components/ui/button";

interface ListingCardProps {
  id: string;
  title: string;
  reserve_price: number; // Changed from price to reserve_price
  status: string;
  onStatusChange?: () => void;
  valuationData?: any;
}

export const ListingCard = ({ 
  id, 
  title, 
  reserve_price, // Changed from price to reserve_price
  status, 
  onStatusChange,
  valuationData
}: ListingCardProps) => {
  const navigate = useNavigate();
  
  // Use our custom hook for reserve price calculation
  const { reservePrice, isCalculating, error } = useReservePrice({ 
    valuationData 
  });

  const viewDetails = () => {
    navigate(`/dashboard/car/${id}`);
  };

  return (
    <Card className="p-4 hover:bg-accent/5 transition-colors">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-lg">{title}</h3>
          <p className="text-subtitle text-sm">
            Status: <span className="capitalize">{status}</span>
          </p>
          <ListingCardPrice 
            price={reservePrice || reserve_price} 
            isCalculating={isCalculating} 
          />
        </div>
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={viewDetails}
          >
            See Details
          </Button>
        </div>
      </div>
    </Card>
  );
};
