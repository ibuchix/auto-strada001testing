/**
 * Changes made:
 * - 2024-09-11: Created auction service for all auction-related operations
 * - 2024-09-19: Optimized queries for better performance and reduced latency
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
}

export interface PlaceBidResult {
  success: boolean;
  bid_id?: string;
  amount?: number;
  error?: string;
}

export class AuctionService extends BaseService {
  /**
   * Get auction results for a seller with optimized JOIN and column selection
   */
  async getSellerAuctionResults(sellerId: string): Promise<AuctionResult[]> {
    try {
      // Perform a single optimized JOIN query instead of two separate queries
      const { data: results, error } = await this.supabase
        .from('auction_results')
        .select(`
          id, 
          car_id,
          final_price, 
          total_bids, 
          unique_bidders,
          sale_status, 
          created_at,
          cars:car_id (
            title, 
            make, 
            model, 
            year, 
            auction_end_time
          )
        `)
        .eq('cars.seller_id', sellerId);

      if (error) throw error;
      
      if (!results || results.length === 0) {
        return [];
      }
      
      // Transform the joined data to the expected format
      return results.map(result => ({
        id: result.id,
        car_id: result.car_id,
        title: result.cars?.title || 'Unknown Vehicle',
        make: result.cars?.make || 'Unknown',
        model: result.cars?.model || '',
        year: result.cars?.year || new Date().getFullYear(),
        final_price: result.final_price,
        total_bids: result.total_bids || 0,
        unique_bidders: result.unique_bidders || 0,
        sale_status: result.sale_status,
        created_at: result.created_at,
        auction_end_time: result.cars?.auction_end_time
      }));
    } catch (error: any) {
      this.handleError(error, "Failed to fetch auction results");
    }
  }
  
  /**
   * Place a bid on a car with optimized error handling
   */
  async placeBid(carId: string, dealerId: string, amount: number, isProxyBid: boolean = false, maxProxyAmount?: number): Promise<PlaceBidResult> {
    try {
      // Using an RPC call for better performance (processed server-side)
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
   */
  async placeProxyBid(carId: string, dealerId: string, maxAmount: number): Promise<PlaceBidResult> {
    try {
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
    }
  }
}

// Export a singleton instance
export const auctionService = new AuctionService();
