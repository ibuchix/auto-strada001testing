import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { Navigation } from "@/components/Navigation";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Car, Heart, Clock, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const BuyerDashboard = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!session) {
      navigate('/auth');
      return;
    }

    const checkRole = async () => {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to verify user role",
          variant: "destructive",
        });
        return;
      }

      if (profile.role !== 'buyer') {
        navigate('/');
        toast({
          title: "Access Denied",
          description: "This page is only accessible to buyers",
          variant: "destructive",
        });
      }
    };

    checkRole();
  }, [session, navigate, toast]);

  if (!session) return null;

  return (
    <div className="min-h-screen bg-accent">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold text-primary mb-2">Welcome Back!</h1>
          <p className="text-subtitle">Discover your perfect vehicle match today.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Quick Stats Cards */}
          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300 animate-fade-in">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xl font-semibold text-dark">Watched Cars</CardTitle>
              <Heart className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-dark">0</div>
              <p className="text-sm text-subtitle mt-1">Vehicles in your watchlist</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300 animate-fade-in [animation-delay:200ms]">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xl font-semibold text-dark">Recent Views</CardTitle>
              <Clock className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-dark">0</div>
              <p className="text-sm text-subtitle mt-1">Cars viewed this week</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300 animate-fade-in [animation-delay:400ms]">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xl font-semibold text-dark">Available Cars</CardTitle>
              <Car className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-dark">0</div>
              <p className="text-sm text-subtitle mt-1">Matching your preferences</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300 animate-fade-in [animation-delay:600ms]">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xl font-semibold text-dark">Notifications</CardTitle>
              <Bell className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-dark">0</div>
              <p className="text-sm text-subtitle mt-1">New updates for you</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* Watchlist Section */}
          <Card className="lg:col-span-2 bg-white shadow-md animate-fade-in [animation-delay:800ms]">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-dark">Your Watchlist</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Heart className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-dark mb-2">No saved vehicles yet</h3>
                <p className="text-subtitle max-w-sm">
                  Start browsing our available cars and add your favorites to your watchlist.
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
                  Your recent car viewing history will appear here.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BuyerDashboard;