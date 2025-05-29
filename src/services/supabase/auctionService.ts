/**
 * Updated: 2025-05-29 - Fixed database queries to use reserve_price instead of removed price column
 */

import { supabase } from '@/integrations/supabase/client';

export const auctionService = {
  async getAuctionDetails(carId: string) {
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('current_bid, reserve_price, minimum_bid_increment, auction_end_time, status')
        .eq('id', carId)
        .single();

      if (error) throw error;

      return {
        currentBid: data.current_bid || 0,
        reservePrice: data.reserve_price || 0,
        minimumIncrement: data.minimum_bid_increment || 100,
        auctionEndTime: data.auction_end_time,
        status: data.status
      };
    } catch (error) {
      console.error('Error fetching auction details:', error);
      throw error;
    }
  },
};
