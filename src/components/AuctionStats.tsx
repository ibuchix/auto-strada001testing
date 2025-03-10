
/**
 * Changes made:
 * - 2024-03-20: Fixed type errors with Supabase query
 * - 2024-03-20: Added proper error handling for missing fields
 * - 2024-03-20: Implemented fallback for missing auction stats
 */

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AuctionStatsProps {
  carId: string;
}

interface AuctionStats {
  unique_bidders: number;
  total_bids: number;
  highest_bid: number;
  lowest_bid: number;
}

export const AuctionStats = ({ carId }: AuctionStatsProps) => {
  const [stats, setStats] = useState<AuctionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAuctionStats = async () => {
      try {
        // First try to query the dedicated view
        const { data, error } = await supabase
          .from('bids')
          .select(`
            car_id,
            count(distinct(dealer_id))::int as unique_bidders,
            count(*)::int as total_bids,
            max(amount)::float as highest_bid,
            min(amount)::float as lowest_bid
          `)
          .eq('car_id', carId)
          .group('car_id')
          .single();

        if (error) {
          console.error('Error fetching auction stats:', error);
          throw error;
        }

        if (data) {
          setStats({
            unique_bidders: data.unique_bidders || 0,
            total_bids: data.total_bids || 0,
            highest_bid: data.highest_bid || 0,
            lowest_bid: data.lowest_bid || 0
          });
        } else {
          // No bids yet, set default values
          setStats({
            unique_bidders: 0,
            total_bids: 0,
            highest_bid: 0,
            lowest_bid: 0
          });
        }
      } catch (error) {
        console.error('Error fetching auction stats:', error);
        toast({
          title: "Error",
          description: "Failed to load auction statistics",
          variant: "destructive",
        });
        // Set default values on error
        setStats({
          unique_bidders: 0,
          total_bids: 0,
          highest_bid: 0,
          lowest_bid: 0
        });
      } finally {
        setLoading(false);
      }
    };

    if (carId) {
      fetchAuctionStats();
    }
  }, [carId, toast]);

  if (loading) {
    return <div className="animate-pulse bg-gray-100 h-24 rounded-lg"></div>;
  }

  if (!stats) {
    return (
      <div className="text-subtitle p-4 bg-accent rounded-lg">
        No auction statistics available yet
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-accent p-4 rounded-lg">
        <p className="text-subtitle text-sm">Unique Bidders</p>
        <p className="text-2xl font-bold text-primary">{stats.unique_bidders}</p>
      </div>
      <div className="bg-accent p-4 rounded-lg">
        <p className="text-subtitle text-sm">Total Bids</p>
        <p className="text-2xl font-bold text-primary">{stats.total_bids}</p>
      </div>
      <div className="bg-accent p-4 rounded-lg">
        <p className="text-subtitle text-sm">Highest Bid</p>
        <p className="text-2xl font-bold text-primary">
          £{stats.highest_bid?.toLocaleString() || 0}
        </p>
      </div>
      <div className="bg-accent p-4 rounded-lg">
        <p className="text-subtitle text-sm">Lowest Bid</p>
        <p className="text-2xl font-bold text-primary">
          £{stats.lowest_bid?.toLocaleString() || 0}
        </p>
      </div>
    </div>
  );
};
