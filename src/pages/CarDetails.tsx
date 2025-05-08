
/**
 * Changes made:
 * - 2025-05-08: Created CarDetails page for viewing car listing details
 * - 2025-05-08: Implemented basic car information display and status management
 * - 2025-05-08: Added activation functionality directly from details page
 * - 2025-05-08: Added formatting utilities and proper reserve price calculation
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, Check } from 'lucide-react';
import { toast } from 'sonner';
import { CarListing } from '@/types/dashboard';
import { formatPrice, calculateReservePrice } from '@/utils/valuation/reservePriceCalculator';

const CarDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { session } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [car, setCar] = useState<CarListing | null>(null);
  const [isActivating, setIsActivating] = useState(false);

  useEffect(() => {
    const fetchCarDetails = async () => {
      if (!id || !session) return;

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('cars')
          .select('*')
          .eq('id', id)
          .eq('seller_id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching car details:', error);
          setError(error.message);
          return;
        }

        if (!data) {
          setError('Car not found or you do not have permission to view it');
          return;
        }

        setCar(data as CarListing);
      } catch (err: any) {
        console.error('Error in car details fetch:', err);
        setError(err.message || 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCarDetails();
  }, [id, session]);

  const handleGoBack = () => {
    navigate('/dashboard/seller');
  };

  const activateListing = async () => {
    if (!car || !session || isActivating) return;
    
    setIsActivating(true);
    try {
      console.log('Activating listing with ID:', car.id);
      
      // Calculate reserve price if missing
      let finalReservePrice = car.reserve_price;
      if (!finalReservePrice && car.valuation_data?.basePrice) {
        finalReservePrice = calculateReservePrice(car.valuation_data.basePrice);
        console.log(`Calculated reserve price on activation: ${finalReservePrice}`);
      }
      
      // Attempt to update the car record
      const { data, error } = await supabase
        .from('cars')
        .update({ 
          is_draft: false,
          status: 'available',
          ...(finalReservePrice ? { reserve_price: finalReservePrice } : {})
        })
        .eq('id', car.id)
        .select();

      if (error) {
        console.error('Error activating listing:', error);
        throw error;
      }
      
      console.log('Listing activation successful:', data);
      toast.success('Listing activated successfully');
      
      // Update local state
      setCar(prev => prev ? { ...prev, is_draft: false, status: 'available' } : null);
      
    } catch (error: any) {
      console.error('Error activating listing:', error);
      toast.error(error.message || "Failed to activate listing");
    } finally {
      setIsActivating(false);
    }
  };

  // Calculate display price and format it
  const getDisplayPrice = () => {
    if (!car) return 'N/A';
    
    // First priority: Use database reserve_price if available
    if (car.reserve_price) {
      return formatPrice(car.reserve_price);
    }
    
    // Second priority: Calculate from valuation data if available
    if (car.valuation_data?.basePrice) {
      const calculatedPrice = calculateReservePrice(car.valuation_data.basePrice);
      return formatPrice(calculatedPrice);
    }
    
    // Fallback to listing price
    return formatPrice(car.price);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <div className="container mx-auto px-4 py-8 mt-16">
        <Button 
          variant="ghost" 
          onClick={handleGoBack}
          className="mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Button>
        
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        )}
        
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {car && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl font-bold">{car.year} {car.make} {car.model}</CardTitle>
                    <p className="text-subtitle">
                      Status: <span className="capitalize">{car.is_draft ? 'Draft' : car.status || 'Unknown'}</span>
                    </p>
                  </div>
                  {car.is_draft && (
                    <Button 
                      onClick={activateListing}
                      disabled={isActivating}
                      className="bg-[#21CA6F] hover:bg-[#21CA6F]/90 text-white"
                    >
                      {isActivating ? 'Activating...' : 'Activate Listing'}
                    </Button>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Vehicle Details</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-subtitle">Make</span>
                        <span className="font-medium">{car.make}</span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-subtitle">Model</span>
                        <span className="font-medium">{car.model}</span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-subtitle">Year</span>
                        <span className="font-medium">{car.year}</span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-subtitle">Mileage</span>
                        <span className="font-medium">{car.mileage?.toLocaleString() || 'Not specified'} km</span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-subtitle">Reserve Price</span>
                        <span className="font-medium text-primary">{getDisplayPrice()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Listing Information</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-subtitle">Status</span>
                        <span className={`font-medium capitalize ${car.is_draft ? 'text-yellow-600' : 'text-green-600'}`}>
                          {car.is_draft ? 'Draft' : car.status || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-subtitle">Created</span>
                        <span className="font-medium">
                          {car.created_at ? new Date(car.created_at).toLocaleDateString() : 'Unknown'}
                        </span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-subtitle">Last Updated</span>
                        <span className="font-medium">
                          {car.updated_at ? new Date(car.updated_at).toLocaleDateString() : 'Unknown'}
                        </span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-subtitle">Auction Type</span>
                        <span className="font-medium">{car.is_auction ? 'Auction' : 'Fixed Price'}</span>
                      </div>
                      {car.auction_status && (
                        <div className="flex justify-between border-b pb-2">
                          <span className="text-subtitle">Auction Status</span>
                          <span className="font-medium capitalize">{car.auction_status}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {car.description && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Description</h3>
                    <p className="text-subtitle">{car.description}</p>
                  </div>
                )}
                
                {/* We're not showing images as requested */}
              </CardContent>
              
              <CardFooter className="flex justify-between pt-4 border-t">
                <Button variant="outline" onClick={handleGoBack}>
                  Back to Dashboard
                </Button>
                {!car.is_draft ? (
                  <div className="flex items-center text-green-600">
                    <Check className="mr-2 h-4 w-4" /> Live on Marketplace
                  </div>
                ) : (
                  <Button 
                    onClick={activateListing}
                    disabled={isActivating}
                    className="bg-[#21CA6F] hover:bg-[#21CA6F]/90 text-white"
                  >
                    {isActivating ? 'Activating...' : 'Activate Listing'}
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default CarDetails;
