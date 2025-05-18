/**
 * Changes made:
 * - 2024-09-11: Created auction service for all auction-related operations
 * - 2024-09-19: Optimized queries for better performance and reduced latency
 * - 2024-09-20: Fixed foreign key relationship issue in join query
 * - 2024-09-21: Updated to respect Row-Level Security policies
 * - 2025-05-20: Fixed permission denied errors by using security definer functions
 * - 2025-06-12: Replaced direct table access with secure RPC function
 */

import { BaseService } from "./baseService";
import { toast } from "sonner";

export interface AuctionResult {
  id: string;
  car_id: string;
  final_price: number | null;
  total_bids: number;
  unique_bidders: number;
  sale_status: string | null;
  created_at: string;
  // Optional fields from joined car data
  title?: string;
  make?: string;
  model?: string;
  year?: number;
  auction_end_time?: string;
}

export interface PlaceBidResult {
  success: boolean;
  bid_id?: string;
  amount?: number;
  error?: string;
}

export class AuctionService extends BaseService {
  /**
   * Get auction results for a seller using secure RPC function
   * Uses security definer function to bypass RLS
   */
  async getSellerAuctionResults(sellerId: string): Promise<AuctionResult[]> {
    try {
      console.log('Fetching auction results for seller:', sellerId);
      
      // Use the new security definer function that combines cars and auction results
      const { data, error } = await this.supabase
        .rpc('fetch_seller_auction_results_complete', { 
          p_seller_id: sellerId 
        });
      
      if (error) {
        console.error('Error fetching auction results:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.log('No auction results found for seller');
        return [];
      }
      
      // The data is already in the format we need
      return data as AuctionResult[];
    } catch (error: any) {
      this.handleError(error, "Failed to fetch auction results");
      return [];
    }
  }
  
  /**
   * Place a bid on a car with optimized error handling
   * Respects RLS: Only dealers can place bids on cars they don't own
   */
  async placeBid(carId: string, dealerId: string, amount: number, isProxyBid: boolean = false, maxProxyAmount?: number): Promise<PlaceBidResult> {
    try {
      // Verify user is authenticated before placing bid
      const session = await this.supabase.auth.getSession();
      if (!session.data.session || session.data.session.user.id !== dealerId) {
        throw new Error("Authentication required to place bids");
      }
      
      // Using an RPC call for better performance (processed server-side)
      // The place_bid function already has security checks built in
      const { data, error } = await this.supabase.rpc('place_bid', {
        p_car_id: carId,
        p_dealer_id: dealerId,
        p_amount: amount,
        p_is_proxy: isProxyBid,
        p_max_proxy_amount: maxProxyAmount || null
      });

      if (error) throw error;
      
      const bidResponse = data as unknown as PlaceBidResult;
      
      if (!bidResponse.success) {
        throw new Error(bidResponse.error || 'Failed to place bid');
      }
      
      // Handle successful bid
      toast.success(
        isProxyBid ? 'Proxy Bid Placed' : 'Bid Placed', 
        {
          description: isProxyBid 
            ? `Your proxy bid has been set with a maximum of ${maxProxyAmount}`
            : `Your bid of ${amount} has been accepted`,
        }
      );
      
      return bidResponse;
    } catch (error: any) {
      // Check if the error is about minimum bid requirement
      if (error.message && error.message.includes('too low')) {
        const match = error.message.match(/minimum bid is (\d+)/i);
        const minimumBid = match ? parseInt(match[1]) : null;
        
        toast.error(
          'Bid Too Low',
          {
            description: `Your bid was below the minimum required. ${minimumBid ? `Minimum bid is ${minimumBid}.` : ''}`,
          }
        );
      } else {
        toast.error(
          'Bid Failed',
          {
            description: error.message,
          }
        );
      }
      
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Place a proxy bid on a car
   * Respects RLS: Only dealers can place proxy bids
   */
  async placeProxyBid(carId: string, dealerId: string, maxAmount: number): Promise<PlaceBidResult> {
    try {
      // Verify user is authenticated before placing proxy bid
      const session = await this.supabase.auth.getSession();
      if (!session.data.session || session.data.session.user.id !== dealerId) {
        throw new Error("Authentication required to place proxy bids");
      }
      
      // First, get the current bid to determine the minimum next bid
      const { data: car } = await this.supabase
        .from('cars')
        .select('current_bid, price, minimum_bid_increment')
        .eq('id', carId)
        .single();
      
      if (!car) {
        throw new Error('Could not retrieve car information');
      }
      
      // Calculate the minimum bid amount
      const currentBid = car.current_bid || car.price;
      const minBidIncrement = car.minimum_bid_increment || 100;
      const minBidAmount = currentBid + minBidIncrement;
      
      // Ensure the maximum amount is at least the minimum bid
      if (maxAmount < minBidAmount) {
        toast.error(
          'Bid Too Low',
          {
            description: `Your maximum bid must be at least ${minBidAmount}`,
          }
        );
        return { success: false, error: `Your maximum bid must be at least ${minBidAmount}` };
      }
      
      // Place the proxy bid with the initial amount and maximum amount
      return await this.placeBid(carId, dealerId, minBidAmount, true, maxAmount);
    } catch (error: any) {
      this.handleError(error, "Failed to place proxy bid");
      return { success: false, error: error.message };
    }
  }
}

// Export a singleton instance
export const auctionService = new AuctionService();
