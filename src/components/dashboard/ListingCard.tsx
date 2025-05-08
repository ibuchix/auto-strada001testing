
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
 */

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { formatPrice, calculateReservePrice } from "@/utils/valuation/reservePriceCalculator";

interface ListingCardProps {
  id: string;
  title: string;
  price: number;
  status: string;
  isDraft: boolean;
  onStatusChange?: () => void;
  valuationData?: any;
  reserve_price?: number; // Database reserve_price field
}

export const ListingCard = ({ 
  id, 
  title, 
  price, 
  status, 
  isDraft, 
  onStatusChange,
  valuationData,
  reserve_price
}: ListingCardProps) => {
  const navigate = useNavigate();
  const [isActivating, setIsActivating] = useState(false);
  const [displayPrice, setDisplayPrice] = useState<number | null>(null);
  
  // Determine which price to display with proper fallback logic
  useEffect(() => {
    const calculateDisplayPrice = async () => {
      try {
        // First priority: Use database reserve_price if available
        if (reserve_price) {
          console.log(`Using database reserve_price for card ${id}: ${reserve_price}`);
          setDisplayPrice(reserve_price);
          return;
        }
        
        // Second priority: Calculate from valuation data if available
        if (valuationData && valuationData.basePrice) {
          try {
            const basePrice = valuationData.basePrice;
            const calculatedReserve = calculateReservePrice(basePrice);
            console.log(`Calculated reserve price for card ${id}: ${calculatedReserve} from base ${basePrice}`);
            setDisplayPrice(calculatedReserve);
            return;
          } catch (error) {
            console.error("Error calculating reserve price:", error);
          }
        }
        
        // Last priority: Use original price as fallback
        console.log(`No reserve price data available for card ${id}, using fallback price: ${price}`);
        setDisplayPrice(price);
      } catch (error) {
        console.error("Error in calculateDisplayPrice:", error);
        setDisplayPrice(price); // Fallback in case of any errors
      }
    };
    
    calculateDisplayPrice();
  }, [id, price, reserve_price, valuationData]);

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
      
      // Calculate reserve price if missing
      let finalReservePrice = reserve_price;
      if (!finalReservePrice && valuationData?.basePrice) {
        finalReservePrice = calculateReservePrice(valuationData.basePrice);
        console.log(`Calculated reserve price on activation: ${finalReservePrice}`);
      }
      
      // Use the activate_listing function to activate the listing
      const { data, error } = await supabase.rpc(
        'activate_listing',
        { 
          p_listing_id: id,
          p_user_id: sessionData.session.user.id,
          p_reserve_price: finalReservePrice
        }
      );

      if (error) {
        console.error('Error activating listing:', error);
        
        // If we got a permission error, try to repair the seller registration
        if (error.code === '42501' || error.message.includes('permission denied')) {
          console.log('Permission error detected, attempting seller registration repair');
          
          // Try to ensure proper seller registration
          const { data: repairData, error: repairError } = await supabase.rpc(
            'ensure_seller_registration'
          );
          
          if (!repairError && repairData?.success) {
            console.log('Successfully repaired seller registration:', repairData);
            
            // Try activation again
            const { data: retryData, error: retryError } = await supabase.rpc(
              'activate_listing',
              { 
                p_listing_id: id,
                p_user_id: sessionData.session.user.id,
                p_reserve_price: finalReservePrice
              }
            );
            
            if (retryError) {
              throw retryError;
            }
            
            toast.success('Listing activated successfully');
            if (onStatusChange) onStatusChange();
            return;
          } else {
            console.error('Failed to repair seller registration:', repairError || 'Unknown error');
            throw new Error('Failed to repair your seller profile. Please contact support.');
          }
        }
        
        throw error;
      }
      
      console.log('Listing activation successful:', data);
      toast.success('Listing activated successfully');
      
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
      
      // Only manually refresh if there was an error
      if (onStatusChange) onStatusChange();
    } finally {
      setIsActivating(false);
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
              disabled={isActivating}
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
