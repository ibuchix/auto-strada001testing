
/**
 * Changes made:
 * - 2024-03-26: Fixed TypeScript errors by using the auction_activity_stats view
 * - 2024-03-26: Implemented a more direct SQL query approach
 */

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface AuctionStatsProps {
  carId: string;
}

interface AuctionStats {
  uniqueBidders: number;
  totalBids: number;
  highestBid: number;
  lowestBid: number;
}

export function AuctionStats({ carId }: AuctionStatsProps) {
  const [stats, setStats] = useState<AuctionStats>({
    uniqueBidders: 0,
    totalBids: 0,
    highestBid: 0,
    lowestBid: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        // Use the auction_activity_stats view we created
        const { data, error } = await supabase
          .from('auction_activity_stats')
          .select('*')
          .eq('car_id', carId)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching auction stats:', error);
          throw error;
        }

        if (data) {
          setStats({
            uniqueBidders: data.unique_bidders || 0,
            totalBids: data.total_bids || 0,
            highestBid: data.highest_bid || 0,
            lowestBid: data.lowest_bid || 0,
          });
        }
      } catch (error) {
        console.error('Error fetching auction stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (carId) {
      fetchStats();
    }
  }, [carId]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500">Unique Bidders</h3>
        <p className="text-2xl font-bold">{stats.uniqueBidders}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500">Total Bids</h3>
        <p className="text-2xl font-bold">{stats.totalBids}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500">Highest Bid</h3>
        <p className="text-2xl font-bold">${stats.highestBid.toLocaleString()}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500">Lowest Bid</h3>
        <p className="text-2xl font-bold">${stats.lowestBid.toLocaleString()}</p>
      </div>
    </div>
  );
}
