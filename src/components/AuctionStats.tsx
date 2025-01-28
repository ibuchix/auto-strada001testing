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
        const { data, error } = await supabase
          .from('auction_activity_stats')
          .select('unique_bidders, total_bids, highest_bid, lowest_bid')
          .eq('car_id', carId)
          .single();

        if (error) throw error;

        setStats(data);
      } catch (error) {
        console.error('Error fetching auction stats:', error);
        toast({
          title: "Error",
          description: "Failed to load auction statistics",
          variant: "destructive",
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