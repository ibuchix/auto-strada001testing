import { useEffect, useState } from "react";
import { Share2, Users, Timer, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AuctionStats {
  unique_bidders: number;
  total_bids: number;
  highest_bid: number;
  auction_end_time: string;
}

interface AuctionStatsProps {
  carId: string;
}

export const AuctionStats = ({ carId }: AuctionStatsProps) => {
  const [stats, setStats] = useState<AuctionStats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      const { data, error } = await supabase
        .from('auction_activity_stats')
        .select('*')
        .eq('car_id', carId)
        .single();

      if (error) {
        console.error('Error fetching auction stats:', error);
        return;
      }

      setStats(data);
    };

    fetchStats();

    // Subscribe to realtime changes
    const subscription = supabase
      .channel('auction_stats_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'auction_activity_stats',
          filter: `car_id=eq.${carId}`,
        },
        (payload) => {
          setStats(payload.new as AuctionStats);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [carId]);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Check out this auction!',
          text: 'I found an interesting car auction you might like.',
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error('Failed to share');
    }
  };

  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Unique Bidders</CardTitle>
          <Users className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.unique_bidders}</div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Total Bids</CardTitle>
          <TrendingUp className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total_bids}</div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Highest Bid</CardTitle>
          <Timer className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            PLN {stats.highest_bid?.toLocaleString() || 0}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Share</CardTitle>
          <Share2 className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={handleShare}
          >
            Share Auction
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};