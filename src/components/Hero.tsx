/**
 * Changes made:
 * - 2024-03-20: Fixed type errors with Supabase query for current_bid
 * - 2024-03-20: Added proper error handling for missing fields
 * - 2024-03-20: Added error handling for failed auctions query to prevent page crash
 */

import { ValuationForm } from "@/components/hero/ValuationForm";
import { BackgroundPattern } from "@/components/hero/BackgroundPattern";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Timer } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface AuctionCar {
  id: string;
  make: string;
  model: string;
  year: number;
  current_bid: number;
  auction_end_time: string;
  auction_status: 'pending' | 'active' | 'completed' | 'cancelled' | 'ended_no_winner';
}

export const Hero = () => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState<{[key: string]: string}>({});
  
  const { data: activeAuctions, isLoading } = useQuery({
    queryKey: ['activeAuctions'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('cars')
          .select(`
            id, make, model, year, auction_end_time, auction_status,
            current_bid
          `)
          .eq('auction_status', 'active')
          .order('auction_end_time', { ascending: true })
          .limit(3);

        if (error) {
          console.error("Failed to load auctions:", error);
          return []; // Return empty array instead of throwing
        }

        if (!data) return [];

        return data.map(car => ({
          id: car.id,
          make: car.make || 'Unknown',
          model: car.model || 'Model',
          year: car.year || new Date().getFullYear(),
          current_bid: car.current_bid || 0,
          auction_end_time: car.auction_end_time || new Date(Date.now() + 24*60*60*1000).toISOString(),
          auction_status: car.auction_status as AuctionCar['auction_status'] || 'active'
        }));
      } catch (error) {
        console.error('Error fetching active auctions:', error);
        return []; // Return empty array on error
      }
    },
    retry: false // Don't retry failed requests
  });

  useEffect(() => {
    const subscription = supabase
      .channel('auction-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cars',
          filter: 'auction_status=eq.active'
        },
        () => {
          void refetch();
        }
      )
      .subscribe();

    return () => {
      void subscription.unsubscribe();
    };
  }, [refetch]);

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft: {[key: string]: string} = {};
      
      activeAuctions?.forEach(auction => {
        const end = new Date(auction.auction_end_time).getTime();
        const now = new Date().getTime();
        const distance = end - now;
        
        if (distance < 0) {
          newTimeLeft[auction.id] = 'Ended';
        } else {
          const hours = Math.floor(distance / (1000 * 60 * 60));
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((distance % (1000 * 60)) / 1000);
          newTimeLeft[auction.id] = `${hours}h ${minutes}m ${seconds}s`;
        }
      });
      
      setTimeLeft(newTimeLeft);
    }, 1000);

    return () => clearInterval(timer);
  }, [activeAuctions]);

  const brands = [
    { 
      name: "Porsche", 
      logo: "https://www.carlogos.org/car-logos/porsche-logo-2100x1100.png" 
    },
    { 
      name: "Mercedes", 
      logo: "https://www.carlogos.org/logo/Mercedes-Benz-logo-2011-1920x1080.png" 
    },
    { 
      name: "BMW", 
      logo: "https://www.carlogos.org/car-logos/bmw-logo-2020-gray.png" 
    },
    { 
      name: "Peugeot", 
      logo: "https://www.carlogos.org/car-logos/peugeot-logo-2010-black.png" 
    },
    { 
      name: "Jaguar", 
      logo: "https://www.carlogos.org/car-logos/jaguar-logo-2012-black.png" 
    },
    { 
      name: "Range Rover", 
      logo: "https://www.carlogos.org/car-logos/range-rover-logo-2010-black.png" 
    },
    { 
      name: "Rolls Royce", 
      logo: "https://www.carlogos.org/car-logos/rolls-royce-logo-black.png" 
    },
    { 
      name: "Audi", 
      logo: "https://www.carlogos.org/car-logos/audi-logo-2016-black.png" 
    },
    { 
      name: "Ferrari", 
      logo: "https://www.carlogos.org/car-logos/ferrari-logo-black.png" 
    },
    { 
      name: "Lamborghini", 
      logo: "https://www.carlogos.org/car-logos/lamborghini-logo-black.png" 
    }
  ];

  return (
    <div className="relative min-h-[700px] flex items-center justify-center overflow-hidden bg-gradient-to-b from-white to-gray-50 mt-4">
      <BackgroundPattern />

      <div className="container relative z-10 max-w-4xl mx-auto px-4 py-20">
        <div className="text-center max-w-2xl mx-auto animate-fade-in">
          <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="text-primary">Sell</span> your car with 
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-iris"> confidence</span>
          </h1>
          <p className="text-xl md:text-2xl text-subtitle mb-12 leading-relaxed">
            We have certified dealers who are ready to give<br className="hidden md:block" />
            you their best price
          </p>
          
          <ValuationForm />

          {/* Active Auctions Section - Only show if we have auctions */}
          {activeAuctions && activeAuctions.length > 0 && (
            <div className="mt-16">
              <h2 className="text-2xl font-bold text-dark mb-6">Live Auctions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {activeAuctions.map((auction) => (
                  <div 
                    key={auction.id}
                    className="bg-white rounded-lg shadow-md p-6 transition-all duration-300 hover:shadow-lg"
                  >
                    <h3 className="text-lg font-semibold text-dark">
                      {auction.year} {auction.make} {auction.model}
                    </h3>
                    <div className="mt-4 flex justify-between items-center">
                      <div className="flex items-center text-primary font-semibold">
                        <span>Current Bid:</span>
                        <span className="ml-2">PLN {auction.current_bid?.toLocaleString() || '0'}</span>
                      </div>
                      <div className="flex items-center text-subtitle">
                        <Timer className="w-4 h-4 mr-2" />
                        <span>{timeLeft[auction.id] || 'Loading...'}</span>
                      </div>
                    </div>
                    <Button 
                      className="w-full mt-4 bg-secondary hover:bg-secondary/90"
                      onClick={() => navigate(`/auctions/${auction.id}`)}
                    >
                      View Auction
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                className="mt-6"
                onClick={() => navigate('/auctions')}
              >
                View All Auctions
              </Button>
            </div>
          )}

          <div className="mt-20">
            <p className="text-sm font-medium text-secondary mb-8">TRUSTED BY LEADING BRANDS</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-8 items-center justify-center max-w-4xl mx-auto">
              {brands.map((brand, index) => (
                <div key={index} className="flex items-center justify-center p-2">
                  <img
                    src={brand.logo}
                    alt={brand.name}
                    className="h-12 w-auto mx-auto opacity-100 hover:scale-110 transition-all duration-300 object-contain"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
