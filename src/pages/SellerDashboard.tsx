import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { Navigation } from "@/components/Navigation";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeBids } from "@/hooks/useRealtimeBids";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, DollarSign, Car, Bell, Users, Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CarListing {
  id: string;
  title: string;
  description: string;
  price: number;
  status: string;
  created_at: string;
  make: string;
  model: string;
  year: number;
  is_draft: boolean;
}

const SellerDashboard = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [listings, setListings] = useState<CarListing[]>([]);
  const [activeListings, setActiveListings] = useState<number>(0);
  
  useRealtimeBids();

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

      if (profile.role !== 'seller') {
        navigate('/');
        toast({
          title: "Access Denied",
          description: "This page is only accessible to sellers",
          variant: "destructive",
        });
      }
    };

    checkRole();
  }, [session, navigate, toast]);

  useEffect(() => {
    const fetchListings = async () => {
      if (!session?.user.id) return;

      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .eq('seller_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to fetch your listings",
          variant: "destructive",
        });
        return;
      }

      setListings(data || []);
      setActiveListings(data?.filter(car => !car.is_draft).length || 0);
    };

    fetchListings();
  }, [session?.user.id, toast]);

  if (!session) return null;

  return (
    <div className="min-h-screen bg-accent">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold text-primary mb-2">Seller Dashboard</h1>
          <p className="text-subtitle">Manage your vehicle listings and track bids.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Quick Stats Cards */}
          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300 animate-fade-in">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xl font-semibold text-dark">Active Listings</CardTitle>
              <Car className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-dark">{activeListings}</div>
              <p className="text-sm text-subtitle mt-1">Cars currently listed</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300 animate-fade-in [animation-delay:200ms]">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xl font-semibold text-dark">Total Bids</CardTitle>
              <DollarSign className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-dark">0</div>
              <p className="text-sm text-subtitle mt-1">Bids received</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300 animate-fade-in [animation-delay:400ms]">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xl font-semibold text-dark">Potential Buyers</CardTitle>
              <Users className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-dark">0</div>
              <p className="text-sm text-subtitle mt-1">Interested dealers</p>
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
          {/* Active Listings Section */}
          <Card className="lg:col-span-2 bg-white shadow-md animate-fade-in [animation-delay:800ms]">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-dark">Your Listings</CardTitle>
            </CardHeader>
            <CardContent>
              {listings.length > 0 ? (
                <div className="space-y-4">
                  {listings.map((listing) => (
                    <Card key={listing.id} className="p-4 hover:bg-accent/5 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {listing.year} {listing.make} {listing.model}
                          </h3>
                          <p className="text-subtitle text-sm">
                            Status: <span className="capitalize">{listing.is_draft ? 'Draft' : listing.status}</span>
                          </p>
                          <p className="text-primary font-semibold mt-1">
                            £{listing.price?.toLocaleString()}
                          </p>
                        </div>
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => navigate('/sell-my-car', { state: { draftId: listing.id } })}
                          className="flex items-center gap-2"
                        >
                          {listing.is_draft ? 'Continue Editing' : 'View Listing'}
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Car className="h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-xl font-semibold text-dark mb-2">No listings yet</h3>
                  <p className="text-subtitle max-w-sm mb-4">
                    Start listing your vehicles to receive bids from potential buyers.
                  </p>
                  <Button 
                    onClick={() => navigate('/sell-my-car')}
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    Create New Listing
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md animate-fade-in [animation-delay:1000ms]">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-dark">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-dark mb-2">No recent activity</h3>
                <p className="text-subtitle">
                  Your recent listing and bid activity will appear here.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;
