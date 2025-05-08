
/**
 * Car Details Page
 * Created: 2025-05-08
 * 
 * Displays detailed view of a car listing without images
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Car, MapPin, Key, BatteryFull, AlertTriangle, Info } from 'lucide-react';
import { formatPrice } from '@/utils/valuation/reservePriceCalculator';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const CarDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [car, setCar] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchCarDetails = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('cars')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) {
          throw error;
        }
        
        setCar(data);
      } catch (err: any) {
        console.error('Error fetching car details:', err);
        setError(err.message || 'Failed to load car details');
        toast.error('Failed to load car details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCarDetails();
  }, [id]);
  
  const activateListing = async () => {
    if (!car || !car.is_draft) return;
    
    try {
      console.log('Activating listing with ID:', id);
      
      const { error } = await supabase
        .from('cars')
        .update({ 
          is_draft: false,
          status: 'available'
        })
        .eq('id', id);

      if (error) {
        throw error;
      }
      
      toast.success('Listing activated successfully');
      setCar(prev => prev ? { ...prev, is_draft: false, status: 'available' } : null);
    } catch (error: any) {
      console.error('Error activating listing:', error);
      toast.error(error.message || 'Failed to activate listing');
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="container mx-auto px-4 py-10">
          <div className="flex justify-center items-center h-64">
            <p className="text-subtitle">Loading car details...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }
  
  if (error || !car) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="container mx-auto px-4 py-10">
          <div className="flex flex-col justify-center items-center h-64">
            <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
            <p className="text-subtitle">{error || 'Car not found'}</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => navigate('/dashboard/seller')}
            >
              Return to Dashboard
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }
  
  // Calculate display price from reserve_price or from valuation data
  const displayPrice = car.reserve_price || 
    (car.valuation_data && car.valuation_data.reservePrice) || 
    car.price;
  
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <div className="container mx-auto px-4 py-10">
        <Button 
          variant="ghost" 
          className="mb-6 flex items-center gap-2"
          onClick={() => navigate('/dashboard/seller')}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Button>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl">{car.year} {car.make} {car.model}</CardTitle>
                    <p className="text-subtitle text-sm mt-1">
                      Status: <span className="capitalize">{car.is_draft ? 'Draft' : car.status}</span>
                    </p>
                  </div>
                  {car.is_draft && (
                    <Button 
                      className="bg-[#21CA6F] hover:bg-[#21CA6F]/90"
                      onClick={activateListing}
                    >
                      Activate Listing
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-3">Vehicle Details</h3>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-gray-500" />
                        <span>Make & Model: </span>
                        <span className="font-medium">{car.make} {car.model}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>Year: </span>
                        <span className="font-medium">{car.year}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span>Mileage: </span>
                        <span className="font-medium">{car.mileage?.toLocaleString()} km</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Key className="h-4 w-4 text-gray-500" />
                        <span>Transmission: </span>
                        <span className="font-medium capitalize">{car.transmission || 'Not specified'}</span>
                      </li>
                      {car.number_of_keys && (
                        <li className="flex items-center gap-2">
                          <Key className="h-4 w-4 text-gray-500" />
                          <span>Number of Keys: </span>
                          <span className="font-medium">{car.number_of_keys}</span>
                        </li>
                      )}
                      {car.is_damaged !== undefined && (
                        <li className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-gray-500" />
                          <span>Damage Status: </span>
                          <span className="font-medium">{car.is_damaged ? 'Vehicle has damage' : 'No reported damage'}</span>
                        </li>
                      )}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-3">Listing Details</h3>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <Info className="h-4 w-4 text-gray-500" />
                        <span>Price: </span>
                        <span className="font-medium text-primary">{formatPrice(displayPrice)}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Info className="h-4 w-4 text-gray-500" />
                        <span>Status: </span>
                        <Badge variant={car.is_draft ? "outline" : "default"}>
                          {car.is_draft ? 'Draft' : car.status || 'Available'}
                        </Badge>
                      </li>
                      {car.service_history_type && (
                        <li className="flex items-center gap-2">
                          <Info className="h-4 w-4 text-gray-500" />
                          <span>Service History: </span>
                          <span className="font-medium capitalize">{car.service_history_type}</span>
                        </li>
                      )}
                      <li className="flex items-center gap-2">
                        <Info className="h-4 w-4 text-gray-500" />
                        <span>Created: </span>
                        <span className="font-medium">
                          {new Date(car.created_at).toLocaleDateString()}
                        </span>
                      </li>
                      {car.updated_at && (
                        <li className="flex items-center gap-2">
                          <Info className="h-4 w-4 text-gray-500" />
                          <span>Last Updated: </span>
                          <span className="font-medium">
                            {new Date(car.updated_at).toLocaleDateString()}
                          </span>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
                
                {car.description && (
                  <>
                    <Separator className="my-6" />
                    <div>
                      <h3 className="font-medium mb-3">Description</h3>
                      <p className="text-gray-700">{car.description}</p>
                    </div>
                  </>
                )}
                
                {car.seller_notes && (
                  <>
                    <Separator className="my-6" />
                    <div>
                      <h3 className="font-medium mb-3">Seller Notes</h3>
                      <p className="text-gray-700">{car.seller_notes}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {car.is_draft ? (
                  <>
                    <Button 
                      className="w-full bg-[#21CA6F] hover:bg-[#21CA6F]/90"
                      onClick={activateListing}
                    >
                      Activate Listing
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => navigate('/sell-my-car', { state: { draftId: id } })}
                    >
                      Edit Listing
                    </Button>
                  </>
                ) : (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate('/sell-my-car', { state: { draftId: id } })}
                  >
                    Edit Listing
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/dashboard/seller')}
                >
                  Back to Dashboard
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CarDetails;
