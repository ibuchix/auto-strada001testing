
/**
 * Changes made:
 * - 2025-05-24: Updated for seller-friendly view - removed images and edit functionality
 * - 2025-05-24: Added proper layout with navigation back to dashboard
 * - 2025-05-24: Integrated with CarDetailsSection component for better presentation
 * - 2025-05-24: Added reserve price display using useReservePrice hook
 * - 2025-05-29: SIMPLIFIED to single reserve_price field - removed price/reserve_price confusion
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Car } from 'lucide-react';
import { safeJsonCast } from '@/utils/supabaseTypeUtils';
import { CarDetailsSection } from '@/components/car-details/CarDetailsSection';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';

interface CarListing {
  id: string;
  title: string;
  reserve_price: number; // Single price field
  make: string;
  model: string;
  year: number;
  mileage: number;
  transmission: string;
  features: Record<string, boolean>;
  description?: string;
  seller_id?: string;
  status: string;
  is_draft: boolean;
  created_at: string;
  updated_at: string;
  seller_name?: string;
  mobile_number?: string;
  vin?: string;
  valuation_data?: any;
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
    return <LoadingIndicator message="Loading car details..." />;
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center mb-6">
          <Link to="/dashboard/seller">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Car className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-dark mb-2">Error Loading Details</h3>
              <p className="text-subtitle">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!carListing) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center mb-6">
          <Link to="/dashboard/seller">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Car className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-dark mb-2">Car Not Found</h3>
              <p className="text-subtitle">The requested car listing could not be found.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header with back navigation */}
      <div className="flex items-center justify-between">
        <Link to="/dashboard/seller">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Car Title and Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-dark">
            {carListing.year} {carListing.make} {carListing.model}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-subtitle mb-1">Reserve Price</h3>
              <p className="text-2xl font-bold text-primary">
                {carListing.reserve_price.toLocaleString()} PLN
              </p>
              <p className="text-xs text-subtitle mt-1">
                Minimum acceptable price for this vehicle
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-subtitle mb-1">Status</h3>
              <p className="text-lg font-semibold capitalize text-dark">
                {carListing.status}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <h4 className="text-sm font-medium text-subtitle">Mileage</h4>
              <p className="font-medium">{carListing.mileage?.toLocaleString()} km</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-subtitle">Transmission</h4>
              <p className="font-medium capitalize">{carListing.transmission}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-subtitle">VIN</h4>
              <p className="font-medium font-mono text-sm">{carListing.vin || 'Not specified'}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-subtitle">Listed</h4>
              <p className="font-medium">
                {new Date(carListing.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Information */}
      <CarDetailsSection car={carListing} />

      {/* Features Section */}
      {carListing.features && Object.keys(carListing.features).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(carListing.features).map(([feature, enabled]) => (
                <div key={feature} className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className={`text-sm ${enabled ? 'text-dark' : 'text-subtitle'}`}>
                    {feature.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CarDetails;
