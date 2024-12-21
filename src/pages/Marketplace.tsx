import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/AuthProvider';

const Marketplace = () => {
  const { session } = useAuth();

  const { data: cars, isLoading } = useQuery({
    queryKey: ['cars'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cars')
        .select(`
          *,
          seller:users(name)
        `)
        .eq('status', 'available')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      <Navigation />
      <div className="container mx-auto px-4 pt-24">
        <h1 className="text-4xl font-bold text-[#222020] mb-8 font-kanit">Available Cars</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cars?.map((car) => (
            <div key={car.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {car.images && car.images[0] && (
                <img 
                  src={car.images[0]} 
                  alt={car.title} 
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4">
                <h3 className="text-xl font-bold text-[#222020] mb-2 font-kanit">{car.title}</h3>
                <p className="text-[#6A6A77] mb-2 font-oswald">
                  Price: ${car.price.toLocaleString()}
                </p>
                <p className="text-[#6A6A77] mb-4 font-oswald">
                  Mileage: {car.mileage.toLocaleString()} miles
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#6A6A77] font-oswald">
                    Seller: {car.seller?.name}
                  </span>
                  {session && (
                    <Button 
                      variant="outline"
                      className="border-2 border-[#DC143C] text-[#DC143C] hover:bg-[#DC143C] hover:text-white transition-colors font-kanit"
                    >
                      View Details
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Marketplace;