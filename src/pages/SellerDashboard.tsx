
/**
 * Changes made:
 * - 2024-03-26: Fixed TypeScript errors
 * - 2024-03-26: Updated to use session.user instead of user property
 * - 2024-03-26: Added proper handling for seller_notes field and optional fields
 * - 2024-03-26: Fixed type conflicts with CarListing interface
 */

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ListingsSection } from "@/components/dashboard/ListingsSection";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";

// Define the interface clearly to avoid conflicts
interface CarListing {
  id: string;
  title: string;
  price: number;
  status: string;
  created_at: string;
  make: string;
  model: string;
  year: number;
  is_draft: boolean;
  is_auction: boolean;
  description?: string; // Make description optional
}

const SellerDashboard = () => {
  const { session } = useAuth();
  const [activeListings, setActiveListings] = useState<CarListing[]>([]);
  const [draftListings, setDraftListings] = useState<CarListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const forceRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    if (!session?.user) return;

    const fetchListings = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('cars')
          .select('*')
          .eq('seller_id', session.user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Transform data to match CarListing interface with description field
        const transformedData = (data || []).map(car => {
          // Handle seller_notes field which might not exist
          const description = car.seller_notes || '';
          
          return {
            id: car.id,
            title: car.title || `${car.make || 'Unknown'} ${car.model || ''} ${car.year || ''}`.trim(),
            price: car.price || 0,
            status: car.status || 'available',
            created_at: car.created_at,
            make: car.make || 'Unknown',
            model: car.model || '',
            year: car.year || new Date().getFullYear(),
            is_draft: car.is_draft,
            is_auction: car.is_auction || false,
            description: description
          } as CarListing;
        });

        // Filter active and draft listings
        const activeCars = transformedData.filter(car => !car.is_draft);
        const draftCars = transformedData.filter(car => car.is_draft);

        setActiveListings(activeCars);
        setDraftListings(draftCars);
      } catch (error) {
        console.error('Error fetching listings:', error);
        toast.error('Failed to load your listings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchListings();
  }, [session, refreshTrigger]);

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <div className="container mx-auto px-4 py-20 mt-20">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-dark">Seller Dashboard</h1>
          <Button onClick={() => window.location.href = '/sell-my-car'} className="bg-primary hover:bg-primary/90 text-white">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Listing
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-40 lg:col-span-2 animate-pulse" />
            <Skeleton className="h-40 animate-pulse" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ListingsSection 
              listings={draftListings}
              onStatusChange={forceRefresh} 
            />
            <ListingsSection 
              listings={activeListings} 
              onStatusChange={forceRefresh}
            />
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default SellerDashboard;
