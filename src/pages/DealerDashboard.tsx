import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { Navigation } from "@/components/Navigation";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeBids } from "@/hooks/useRealtimeBids";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Coins, Bell, Handshake, ChartBar, Clock } from "lucide-react";

const DealerDashboard = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  useRealtimeBids();

  useEffect(() => {
    const checkAccess = async () => {
      if (!session) {
        navigate('/auth');
        return;
      }

      try {
        // First check if user has dealer role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profileError || profile.role !== 'dealer') {
          navigate('/');
          toast({
            title: "Access Denied",
            description: "This page is only accessible to dealers",
            variant: "destructive",
          });
          return;
        }

        // Then check if dealer record exists
        const { data: dealer, error: dealerError } = await supabase
          .from('dealers')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (dealerError) {
          console.error('Error fetching dealer record:', dealerError);
          navigate('/');
          toast({
            title: "Error",
            description: "Failed to verify dealer status. Please contact support.",
            variant: "destructive",
          });
          return;
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error checking dealer access:', error);
        navigate('/');
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      }
    };

    checkAccess();
  }, [session, navigate, toast]);

  if (!session || isLoading) return null;

  return (
    <div className="min-h-screen bg-accent">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold text-primary mb-2">Dealer Dashboard</h1>
          <p className="text-subtitle">Track your bids and manage your inventory.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Quick Stats Cards */}
          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300 animate-fade-in">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xl font-semibold text-dark">Active Bids</CardTitle>
              <Coins className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-dark">0</div>
              <p className="text-sm text-subtitle mt-1">Pending responses</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300 animate-fade-in [animation-delay:200ms]">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xl font-semibold text-dark">Inventory</CardTitle>
              <Car className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-dark">0</div>
              <p className="text-sm text-subtitle mt-1">Cars in stock</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300 animate-fade-in [animation-delay:400ms]">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xl font-semibold text-dark">Successful Deals</CardTitle>
              <Handshake className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-dark">0</div>
              <p className="text-sm text-subtitle mt-1">Completed purchases</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300 animate-fade-in [animation-delay:600ms]">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xl font-semibold text-dark">Updates</CardTitle>
              <Bell className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-dark">0</div>
              <p className="text-sm text-subtitle mt-1">New notifications</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* Performance Overview Section */}
          <Card className="lg:col-span-2 bg-white shadow-md animate-fade-in [animation-delay:800ms]">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-dark">Performance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ChartBar className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-dark mb-2">No data available</h3>
                <p className="text-subtitle max-w-sm">
                  Start bidding on vehicles to see your performance metrics.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity Section */}
          <Card className="bg-white shadow-md animate-fade-in [animation-delay:1000ms]">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-dark">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-dark mb-2">No recent activity</h3>
                <p className="text-subtitle">
                  Your recent bidding activity will appear here.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DealerDashboard;