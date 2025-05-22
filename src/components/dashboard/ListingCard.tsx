
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
 */

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { formatPrice, calculateReservePrice } from "@/utils/valuation/reservePriceCalculator";
import { useCarStatusTransitions } from "@/hooks/useCarStatusTransitions";

interface ListingCardProps {
  id: string;
  title: string;
  price: number;
  status: string;
  isDraft: boolean;
  onStatusChange?: () => void;
  valuationData?: any;
  reserve_price?: number; // Database reserve_price field (no longer used)
}

export const ListingCard = ({ 
  id, 
  title, 
  price, 
  status, 
  isDraft, 
  onStatusChange,
  valuationData,
  reserve_price // Kept in interface for backward compatibility but not used
}: ListingCardProps) => {
  const navigate = useNavigate();
  const [isActivating, setIsActivating] = useState(false);
  const [displayPrice, setDisplayPrice] = useState<number | null>(null);
  const { transitionStatus } = useCarStatusTransitions({
    onTransitionSuccess: () => {
      if (onStatusChange) onStatusChange();
    }
  });
  
  // Calculate reserve price using ONLY our pricing logic, no fallbacks to database value
  useEffect(() => {
    const calculateDisplayPrice = async () => {
      try {
        if (valuationData && valuationData.basePrice) {
          const calculatedReserve = calculateReservePrice(valuationData.basePrice);
          console.log(`Calculated reserve price for card ${id}: ${calculatedReserve} from base ${valuationData.basePrice}`);
          setDisplayPrice(calculatedReserve);
        } else {
          console.log(`No valuation data available for card ${id}, cannot calculate reserve price`);
          setDisplayPrice(null);
        }
      } catch (error) {
        console.error("Error in calculateDisplayPrice:", error);
        setDisplayPrice(null); // Don't show any price if we can't calculate it properly
      }
    };
    
    calculateDisplayPrice();
  }, [id, valuationData]);

  const activateListing = async () => {
    if (isActivating) return;
    
    setIsActivating(true);
    try {
      console.log('Activating listing with ID:', id);
      
      // Get current user session to confirm auth status
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        throw new Error("You must be logged in to activate a listing");
      }
      
      console.log(`Auth status confirmed for user: ${sessionData.session.user.id}`);
      
      // Calculate reserve price using ONLY our pricing logic
      let calculatedReservePrice: number | null = null;
      if (valuationData?.basePrice) {
        calculatedReservePrice = calculateReservePrice(valuationData.basePrice);
        console.log(`Calculated reserve price on activation: ${calculatedReservePrice}`);
      } else {
        throw new Error("Cannot activate listing without valuation data");
      }
      
      // Use the transition_car_status function instead of activate_listing for more reliable updates
      const result = await transitionStatus(
        id,
        'available',  // Set status to available
        false         // Set isDraft to false
      );
      
      if (!result) {
        throw new Error("Failed to activate listing through transition");
      }
      
      toast.success('Listing activated successfully', {
        description: 'Your listing is now live and visible to dealers'
      });
      
      // Force refresh the listings
      if (onStatusChange) onStatusChange();
    } catch (error: any) {
      console.error('Error activating listing:', error);
      
      // Show more detailed error message based on error type
      if (error.code === '42501') {
        toast.error("Permission denied. You may not have access to activate this listing.");
      } else if (error.code && error.code.startsWith('2')) {
        toast.error(`Database error: ${error.message}`);
      } else {
        toast.error(error.message || "Failed to activate listing");
      }
      
      // Try a fallback approach using the original activate_listing method
      try {
        console.log('Attempting fallback activation method...');
        const { data: authSession } = await supabase.auth.getSession();
        
        if (!authSession?.session) {
          throw new Error("Authentication session required");
        }
        
        // Calculate reserve price again to ensure it's in scope for this method
        let calculatedReservePrice: number | null = null;
        if (valuationData?.basePrice) {
          calculatedReservePrice = calculateReservePrice(valuationData.basePrice);
          console.log(`Recalculated reserve price for fallback activation: ${calculatedReservePrice}`);
        } else {
          throw new Error("Cannot activate listing without valuation data");
        }
        
        const { data, error } = await supabase.rpc(
          'activate_listing',
          { 
            p_listing_id: id,
            p_user_id: authSession.session.user.id,
            p_reserve_price: calculatedReservePrice
          }
        );

        if (error) {
          console.error('Fallback activation failed:', error);
          toast.error(`Activation failed: ${error.message}`);
        } else {
          console.log('Fallback activation succeeded:', data);
          toast.success('Listing activated successfully');
          if (onStatusChange) onStatusChange();
        }
      } catch (fallbackError) {
        console.error('Fallback activation error:', fallbackError);
      }
    } finally {
      setIsActivating(false);
      // Force refresh to ensure UI is updated
      if (onStatusChange) onStatusChange();
    }
  };

  const viewDetails = () => {
    // Navigate to car details page
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
          <p className="text-primary font-semibold mt-1">
            {displayPrice !== null ? formatPrice(displayPrice, 'PLN') : 'Calculating...'}
          </p>
        </div>
        <div className="flex gap-2">
          {isDraft && (
            <Button 
              variant="default"
              size="sm"
              onClick={activateListing}
              disabled={isActivating || displayPrice === null}
              className="bg-[#21CA6F] hover:bg-[#21CA6F]/90"
            >
              {isActivating ? 'Activating...' : 'Activate Listing'}
            </Button>
          )}
          <Button 
            variant="outline"
            size="sm"
            onClick={viewDetails}
            className="flex items-center gap-2"
          >
            {isDraft ? 'See Details' : 'View Listing'}
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
