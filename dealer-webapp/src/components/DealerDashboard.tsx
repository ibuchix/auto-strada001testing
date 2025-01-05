import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Coins, Bell } from "lucide-react";

export const DealerDashboard = () => {
  const { session } = useAuth();
  const [activeBids, setActiveBids] = useState(0);
  const [availableCars, setAvailableCars] = useState(0);

  useEffect(() => {
    if (!session?.user.id) return;

    const fetchDashboardData = async () => {
      // Fetch active bids count
      const { count: bidsCount } = await supabase
        .from('bids')
        .select('*', { count: 'exact', head: true })
        .eq('dealer_id', session.user.id)
        .eq('status', 'pending');

      setActiveBids(bidsCount || 0);

      // Fetch available cars count
      const { count: carsCount } = await supabase
        .from('cars')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'available')
        .is('is_draft', false);

      setAvailableCars(carsCount || 0);
    };

    fetchDashboardData();
  }, [session?.user.id]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Dealer Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xl font-medium">Active Bids</CardTitle>
            <Coins className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeBids}</div>
            <p className="text-sm text-subtitle">Pending responses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xl font-medium">Available Cars</CardTitle>
            <Car className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{availableCars}</div>
            <p className="text-sm text-subtitle">Ready for bidding</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xl font-medium">Notifications</CardTitle>
            <Bell className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
            <p className="text-sm text-subtitle">New updates</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};