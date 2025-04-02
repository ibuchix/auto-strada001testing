/**
 * Changes made:
 * - 2024-06-17: Fixed TypeScript type errors for Supabase RPC response data
 * - 2024-06-17: Added proper type assertions and interfaces for bid responses
 * - 2024-06-18: Fixed type conversion error with safer type assertion
 * - Current: Updated to use dedicated proxy bid processing service
 */

import { useState } from 'react';
import { useToast } from './use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { processCarProxyBids } from '@/services/proxyBidService';

// Define proper interfaces for RPC responses
interface BidResponse {
  success: boolean;
  error?: string;
  bid_id?: string;
  amount?: number;
  minimum_bid?: number;
}

export const useBidding = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { session } = useAuth();

  const placeBid = async (carId: string, amount: number, isProxyBid: boolean = false, maxProxyAmount?: number) => {
    if (!session?.user) {
      setError('You must be logged in to place a bid');
      toast({
        title: 'Authentication Error',
        description: 'You must be logged in to place a bid',
        variant: 'destructive',
      });
      return { success: false };
    }

    setIsLoading(true);
    setError(null);

    try {
      // Validate role is dealer
      if (session.user.role !== 'dealer') {
        throw new Error('Only dealers can place bids');
      }

      // Call the place_bid database function
      const { data, error } = await supabase.rpc('place_bid', {
        p_car_id: carId,
        p_dealer_id: session.user.id,
        p_amount: amount,
        p_is_proxy: isProxyBid,
        p_max_proxy_amount: maxProxyAmount || null
      });

      if (error) {
        throw new Error(error.message);
      }

      // Safely convert the data to BidResponse with proper type checking
      // First convert to unknown, then to BidResponse
      const bidResponse = data as unknown as BidResponse;
      
      // Validate that we have a proper response object
      if (typeof bidResponse !== 'object' || bidResponse === null) {
        throw new Error('Invalid response format from server');
      }

      // Handle successful bid
      if (bidResponse.success) {
        toast({
          title: isProxyBid ? 'Proxy Bid Placed' : 'Bid Placed',
          description: isProxyBid 
            ? `Your proxy bid has been set with a maximum of ${maxProxyAmount}`
            : `Your bid of ${amount} has been accepted`,
          variant: 'default',
        });
        
        // If it's a proxy bid, trigger the dedicated function to execute it
        if (isProxyBid) {
          try {
            // Use the dedicated proxy bid processing service
            await processCarProxyBids(carId, { showToasts: false });
          } catch (proxyError) {
            // Just log the error, don't fail the bid (processing can happen later)
            console.warn('Proxy bid placed but processing failed. System will retry automatically.', proxyError);
          }
        }
        
        return { success: true, bidId: bidResponse.bid_id, amount: bidResponse.amount };
      } else {
        // Handle bid placement failure from the function
        throw new Error(bidResponse.error || 'Failed to place bid');
      }
    } catch (err: any) {
      setError(err.message);
      
      // Check if the error is about minimum bid requirement
      if (err.message.includes('too low')) {
        const match = err.message.match(/minimum bid is (\d+)/i);
        const minimumBid = match ? parseInt(match[1]) : null;
        
        toast({
          title: 'Bid Too Low',
          description: `Your bid was below the minimum required. ${minimumBid ? `Minimum bid is ${minimumBid}.` : ''}`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Bid Failed',
          description: err.message,
          variant: 'destructive',
        });
      }
      
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  const placeProxyBid = async (carId: string, maxAmount: number) => {
    // For a proxy bid, we set the initial bid to the minimum required
    // but we also set the maximum amount the dealer is willing to pay
    
    // First, get the current bid to determine the minimum next bid
    const { data: car } = await supabase
      .from('cars')
      .select('current_bid, price, minimum_bid_increment')
      .eq('id', carId)
      .single();
    
    if (!car) {
      setError('Could not retrieve car information');
      toast({
        title: 'Error',
        description: 'Could not retrieve car information',
        variant: 'destructive',
      });
      return { success: false };
    }
    
    // Calculate the minimum bid amount
    const currentBid = car.current_bid || car.price;
    const minBidIncrement = car.minimum_bid_increment || 100;
    const minBidAmount = currentBid + minBidIncrement;
    
    // Ensure the maximum amount is at least the minimum bid
    if (maxAmount < minBidAmount) {
      setError(`Your maximum bid must be at least ${minBidAmount}`);
      toast({
        title: 'Bid Too Low',
        description: `Your maximum bid must be at least ${minBidAmount}`,
        variant: 'destructive',
      });
      return { success: false };
    }
    
    // Place the proxy bid with the initial amount and maximum amount
    return placeBid(carId, minBidAmount, true, maxAmount);
  };

  return {
    placeBid,
    placeProxyBid,
    isLoading,
    error
  };
};
