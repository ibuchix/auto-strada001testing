
/**
 * Changes made:
 * - 2024-03-20: Fixed CarListing interface to match database schema
 * - 2024-03-20: Added proper error handling for type mismatches
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { Navigation } from "@/components/Navigation";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeBids } from "@/hooks/useRealtimeBids";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { ListingsSection } from "@/components/dashboard/ListingsSection";
import { ActivitySection } from "@/components/dashboard/ActivitySection";
import { AuctionStats } from "@/components/AuctionStats";

interface CarListing {
  id: string;
  title: string;
  description?: string;
  price: number;
  status: string;
  created_at: string;
  make: string;
  model: string;
  year: number;
  is_draft: boolean;
  is_auction: boolean;
}

const SellerDashboard = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [listings, setListings] = useState<CarListing[]>([]);
  const [activeListings, setActiveListings] = useState<number>(0);
  const [auctionListings, setAuctionListings] = useState<CarListing[]>([]);
  
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

    // Transform the data to match the CarListing interface
    const formattedListings: CarListing[] = data?.map(car => ({
      id: car.id,
      title: car.title || `${car.year} ${car.make} ${car.model}`,
      description: "",  // Providing default value for required field
      price: car.price || 0,
      status: car.status || 'available',
      created_at: car.created_at,
      make: car.make || 'Unknown',
      model: car.model || 'Model',
      year: car.year || new Date().getFullYear(),
      is_draft: car.is_draft,
      is_auction: car.is_auction || false
    })) || [];

    setListings(formattedListings);
    
    // Filter auction listings
    const auctions = formattedListings.filter(car => car.is_auction && !car.is_draft) || [];
    setAuctionListings(auctions);
    setActiveListings(formattedListings.filter(car => !car.is_draft).length || 0);
  };

  useEffect(() => {
    fetchListings();
  }, [session?.user.id]);

  if (!session) return null;

  return (
    <div className="min-h-screen bg-accent">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold text-primary mb-2">Seller Dashboard</h1>
          <p className="text-subtitle">Manage your vehicle listings and track bids.</p>
        </div>

        <DashboardStats activeListings={activeListings} />

        {/* Auction Stats Section */}
        {auctionListings.length > 0 && (
          <div className="mt-8 mb-6">
            <h2 className="text-2xl font-bold text-dark mb-4">Auction Statistics</h2>
            <div className="space-y-6">
              {auctionListings.map((listing) => (
                <div key={listing.id} className="bg-white rounded-lg shadow-sm p-4">
                  <h3 className="text-lg font-semibold text-dark mb-3">
                    {listing.year} {listing.make} {listing.model}
                  </h3>
                  <AuctionStats carId={listing.id} />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <ListingsSection listings={listings} onStatusChange={fetchListings} />
          <ActivitySection />
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;
