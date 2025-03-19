
/**
 * Changes made:
 * - 2024-03-19: Initial implementation of sell my car page
 * - 2024-03-19: Added authentication check
 * - 2024-03-19: Implemented form integration
 * - 2024-06-07: Updated to use refactored form components
 * - 2024-10-19: Added validation to ensure VIN check was performed before accessing page
 * - 2024-11-11: Fixed issue with data validation that prevented form display
 * - 2024-11-11: Improved error handling for inconsistent localStorage data
 * - 2024-11-12: Enhanced page load handling for direct navigation cases
 * - 2024-12-05: Completely redesigned data validation and error handling
 */

import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { CarListingForm } from "@/components/forms/CarListingForm";
import { useAuth } from "@/components/AuthProvider";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const SellMyCar = () => {
  const { session, isSeller, refreshSellerStatus } = useAuth();
  const navigate = useNavigate();
  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'auth' | 'data' | 'seller' | null>(null);

  useEffect(() => {
    const validateAndLoadData = async () => {
      try {
        console.log('SellMyCar: Starting validation', { 
          isLoggedIn: !!session, 
          isSeller 
        });
        
        // Step 1: Check authentication
        if (!session) {
          console.log('SellMyCar: No session found');
          setError("Please sign in to create a listing");
          setErrorType('auth');
          setIsLoading(false);
          return;
        }
        
        // Step 2: Check if seller status needs verification
        if (!isSeller) {
          console.log('SellMyCar: Verifying seller status');
          const sellerStatus = await refreshSellerStatus();
          
          if (!sellerStatus) {
            console.log('SellMyCar: Not a seller');
            setError("Please register as a seller to list your car");
            setErrorType('seller');
            setIsLoading(false);
            return;
          }
        }
        
        // Step 3: Validate required data from localStorage
        console.log('SellMyCar: Validating localStorage data');
        const tempVIN = localStorage.getItem("tempVIN");
        const tempMileage = localStorage.getItem("tempMileage");
        const valuationDataStr = localStorage.getItem("valuationData");
        
        if (!tempVIN || !tempMileage) {
          console.log('SellMyCar: Missing VIN or mileage data');
          setError("Missing vehicle information. Please complete a valuation first.");
          setErrorType('data');
          setIsLoading(false);
          return;
        }
        
        // Step 4: Parse and validate the valuation data (but continue even if missing)
        try {
          if (valuationDataStr) {
            const valuationData = JSON.parse(valuationDataStr);
            console.log('SellMyCar: Parsed valuation data successfully', {
              make: valuationData.make,
              model: valuationData.model,
              year: valuationData.year
            });
          } else {
            console.warn('SellMyCar: No valuation data found, but continuing with basic info');
            toast.info("Limited vehicle data available. Some fields may need manual entry.");
          }
        } catch (parseError) {
          console.error('SellMyCar: Error parsing valuation data:', parseError);
          // Continue anyway - this isn't a showstopper
          toast.info("Some vehicle data could not be loaded. Manual entry may be required.");
        }
        
        // All checks passed - allow the form to display
        console.log('SellMyCar: All validation passed');
        setIsValid(true);
        setIsLoading(false);
      } catch (error) {
        console.error('SellMyCar: Unexpected error during validation:', error);
        setError("An unexpected error occurred. Please try again.");
        setIsLoading(false);
      }
    };

    validateAndLoadData();
  }, [session, isSeller, navigate, refreshSellerStatus]);

  // Handle various error states with appropriate UI and actions
  if (error) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 py-20 mt-20">
          <Card className="max-w-md mx-auto p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Unable to Create Listing</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex justify-center">
              {errorType === 'auth' && (
                <Button onClick={() => navigate('/auth')}>
                  Sign In
                </Button>
              )}
              {errorType === 'data' && (
                <Button onClick={() => navigate('/')}>
                  Start Valuation
                </Button>
              )}
              {errorType === 'seller' && (
                <Button onClick={() => navigate('/auth')}>
                  Register as Seller
                </Button>
              )}
              {!errorType && (
                <Button onClick={() => navigate('/')}>
                  Go Home
                </Button>
              )}
            </div>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-center">
          <p className="text-xl">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isValid) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="container mx-auto px-4 py-20 mt-20">
        <h1 className="text-5xl font-bold text-center mb-12">
          List Your Car
        </h1>
        <div className="max-w-2xl mx-auto">
          <CarListingForm />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SellMyCar;
