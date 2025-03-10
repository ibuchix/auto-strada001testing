
/**
 * Changes made:
 * - 2024-06-13: Created useBidding hook for managing bid operations
 * - 2024-06-13: Implemented comprehensive error handling and bid validation
 * - 2024-06-14: Fixed import path for bidUtils and type safety
 * - 2024-06-15: Enhanced with conflict resolution and user notifications
 */

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { placeBid, BidData, BidResponse, calculateMinimumBid, adminEndAuction } from '@/utils/bidUtils';
import { useAuth } from '@/components/AuthProvider';
import { cleanupBidStorage } from '@/components/forms/car-listing/submission/utils/storageCleanup';

interface UseBiddingOptions {
  onBidSuccess?: (response: BidResponse) => void;
  onBidError?: (error: string, minimumBid?: number) => void;
  onBidOutbid?: () => void;
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
    
    // Verify user is a dealer
    if (session.user.role !== 'dealer') {
      toast({
        variant: 'destructive',
        title: 'Permission Denied',
        description: 'Only dealers can place bids.'
      });
      return { success: false, error: 'Only dealers can place bids' };
    }
    
    try {
      setIsSubmitting(true);
      
      // Store temporary bid data for resilience
      localStorage.setItem('lastBidAmount', bidData.amount.toString());
      
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
        
        // Clean up any temporary bid state in localStorage
        cleanupBidStorage();
        
        // Call success callback if provided
        if (options?.onBidSuccess) {
          options.onBidSuccess(response);
        }
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
        } else if (response.error?.includes('own vehicle')) {
          toast({
            variant: 'destructive',
            title: 'Bidding Not Allowed',
            description: 'You cannot bid on your own vehicle.'
          });
        } else if (response.error?.includes('Only dealers')) {
          toast({
            variant: 'destructive',
            title: 'Permission Denied',
            description: 'Only dealers can place bids.'
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
  
  /**
   * For admins to end an auction
   */
  const endAuction = async (carId: string, markAsSold: boolean = true) => {
    if (!session?.user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Required',
        description: 'You must be logged in to perform this action.'
      });
      return { success: false, error: 'Authentication required' };
    }
    
    // Verify user is an admin
    if (session.user.role !== 'admin') {
      toast({
        variant: 'destructive',
        title: 'Permission Denied',
        description: 'Only administrators can end auctions.'
      });
      return { success: false, error: 'Permission denied' };
    }
    
    try {
      setIsSubmitting(true);
      const response = await adminEndAuction(carId, session.user.id, markAsSold);
      
      if (response.success) {
        toast({
          title: 'Auction Ended',
          description: markAsSold ? 'The vehicle has been marked as sold.' : 'The auction has been ended.'
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Action Failed',
          description: response.error || 'Failed to end auction. Please try again.'
        });
      }
      
      return response;
    } catch (error: any) {
      const errorMessage = error.message || 'An unexpected error occurred';
      
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage
      });
      
      return { success: false, error: errorMessage };
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return {
    submitBid,
    endAuction,
    isSubmitting,
    calculateMinimumBid
  };
};
