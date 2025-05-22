
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { safeJsonCast } from '@/utils/supabaseTypeUtils';

interface CarListing {
  id: string;
  title: string;
  price: number;
  make: string;
  model: string;
  year: number;
  mileage: number;
  transmission: string;
  features: Record<string, boolean>;
  description?: string;
  images?: string[];
  seller_id?: string;
}

const CarDetails = () => {
  const { carId } = useParams<{ carId: string }>();
  const [carListing, setCarListing] = useState<CarListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCarDetails = async () => {
    if (!carId) return;
  
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .eq('id', carId)
        .single();
    
      if (error) {
        console.error("Error fetching car details:", error);
        toast.error("Failed to load car details");
        setError(error.message);
        return;
      }
    
      // Safe type casting with proper conversion
      setCarListing(safeJsonCast<CarListing>(data));
    } catch (error) {
      console.error("Exception fetching car details:", error);
      toast.error("An unexpected error occurred");
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCarDetails();
  }, [carId]);

  if (loading) {
    return <div>Loading car details...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!carListing) {
    return <div>Car not found.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{carListing.title}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          {carListing.images && carListing.images.length > 0 ? (
            <img src={carListing.images[0]} alt={carListing.title} className="w-full h-auto rounded-md" />
          ) : (
            <div className="bg-gray-200 aspect-w-16 aspect-h-9 rounded-md"></div>
          )}
        </div>
        <div>
          <p><strong>Price:</strong> ${carListing.price}</p>
          <p><strong>Make:</strong> {carListing.make}</p>
          <p><strong>Model:</strong> {carListing.model}</p>
          <p><strong>Year:</strong> {carListing.year}</p>
          <p><strong>Mileage:</strong> {carListing.mileage} miles</p>
          <p><strong>Transmission:</strong> {carListing.transmission}</p>
          {carListing.description && (
            <>
              <h2 className="text-xl font-semibold mt-4">Description</h2>
              <p>{carListing.description}</p>
            </>
          )}
          <h2 className="text-xl font-semibold mt-4">Features</h2>
          <ul>
            {Object.entries(carListing.features).map(([feature, value]) => (
              <li key={feature}>
                {feature}: {value ? 'Yes' : 'No'}
              </li>
            ))}
          </ul>
          <Link to={`/edit-car/${carListing.id}`}>
            <Button>Edit Car</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CarDetails;
