
/**
 * Changes made:
 * - 2024-06-13: Created useBidding hook for managing bid operations
 * - 2024-06-13: Implemented comprehensive error handling and bid validation
 * - 2024-06-14: Fixed import path for bidUtils and type safety
 */

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { placeBid, BidData, BidResponse, calculateMinimumBid } from '@/utils/bidUtils';
import { useAuth } from '@/components/AuthProvider';

interface UseBiddingOptions {
  onBidSuccess?: (response: BidResponse) => void;
  onBidError?: (error: string, minimumBid?: number) => void;
}

export const useBidding = (options?: UseBiddingOptions) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { session } = useAuth();
  
  /**
   * Submit a bid with proper validation and error handling
   */
  const submitBid = async (bidData: Omit<BidData, 'dealerId'>) => {
    // Validation checks
    if (!session?.user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Required',
        description: 'You must be logged in to place a bid.'
      });
      return { success: false, error: 'Authentication required' };
    }
    
    try {
      setIsSubmitting(true);
      
      // Prepare complete bid data with dealer ID
      const completeBidData: BidData = {
        ...bidData,
        dealerId: session.user.id
      };
      
      // Submit the bid using the atomic function
      const response = await placeBid(completeBidData);
      
      // Handle the response
      if (response.success) {
        toast({
          title: 'Bid Placed Successfully',
          description: `Your bid of ${response.amount?.toLocaleString()} PLN has been placed.`
        });
        
        // Call success callback if provided
        if (options?.onBidSuccess) {
          options.onBidSuccess(response);
        }
        
        // Clean up any temporary bid state in localStorage
        localStorage.removeItem('lastBidAmount');
      } else {
        // Handle specific error cases
        if (response.error?.includes('too low')) {
          toast({
            variant: 'destructive',
            title: 'Bid Too Low',
            description: `Minimum bid required: ${response.minimumBid?.toLocaleString()} PLN`
          });
        } else if (response.error?.includes('not currently active')) {
          toast({
            variant: 'destructive',
            title: 'Auction Not Active',
            description: 'This auction is not currently active.'
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'Bid Failed',
            description: response.error || 'Failed to place bid. Please try again.'
          });
        }
        
        // Call error callback if provided
        if (options?.onBidError) {
          options.onBidError(response.error || 'Unknown error', response.minimumBid);
        }
      }
      
      return response;
    } catch (error: any) {
      const errorMessage = error.message || 'An unexpected error occurred';
      
      toast({
        variant: 'destructive',
        title: 'Bid Error',
        description: errorMessage
      });
      
      // Call error callback if provided
      if (options?.onBidError) {
        options.onBidError(errorMessage);
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return {
    submitBid,
    isSubmitting,
    calculateMinimumBid
  };
};
