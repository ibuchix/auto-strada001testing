
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
 * - 2024-12-29: Improved seller verification with enhanced error handling and better feedback
 * - 2025-07-05: Fixed issues with direct navigation from valuation result
 */

import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { CarListingForm } from "@/components/forms/CarListingForm";
import { useAuth } from "@/components/AuthProvider";
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const SellMyCar = () => {
  const { session, isSeller, refreshSellerStatus } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'auth' | 'data' | 'seller' | null>(null);

  useEffect(() => {
    const validateAndLoadData = async () => {
      try {
        console.log('SellMyCar: Starting validation', { 
          isLoggedIn: !!session, 
          isSeller,
          locationState: location.state,
          hasLocationState: !!location.state
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
          setIsVerifying(true);
          
          // Show verifying toast with auto-dismiss
          const toastId = toast.loading("Verifying seller status...");
          setTimeout(() => toast.dismiss(toastId), 3000);
          
          const sellerStatus = await refreshSellerStatus();
          setIsVerifying(false);
          
          if (!sellerStatus) {
            console.log('SellMyCar: Not a seller');
            setError("Please register as a seller to list your car");
            setErrorType('seller');
            setIsLoading(false);
            return;
          } else {
            console.log('SellMyCar: Successfully verified as seller');
            toast.success("Seller status verified");
          }
        }
        
        // Step 3: Try to get data from location state first (most reliable)
        const stateData = location.state?.valuationData;
        
        if (stateData) {
          console.log('SellMyCar: Using data from location state');
          
          // If we have data from navigation state, make sure it's also in localStorage
          localStorage.setItem('valuationData', JSON.stringify(stateData));
          
          if (stateData.vin) {
            localStorage.setItem('tempVIN', stateData.vin);
          }
          
          if (location.state?.fromValuation) {
            console.log('SellMyCar: Valid navigation from valuation');
            setIsValid(true);
            setIsLoading(false);
            return;
          }
        }
        
        // Step 4: Validate required data from localStorage as fallback
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
        
        // Step 5: Parse and validate the valuation data (but continue even if missing)
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
  }, [session, isSeller, navigate, refreshSellerStatus, location]);

  // Retry seller verification manually
  const handleRetrySellerVerification = async () => {
    setIsVerifying(true);
    toast.loading("Retrying seller verification...");
    
    try {
      const result = await refreshSellerStatus();
      setIsVerifying(false);
      
      if (result) {
        toast.success("Seller verification successful!");
        setError(null);
        setErrorType(null);
        setIsValid(true);
      } else {
        toast.error("Still unable to verify seller status");
      }
    } catch (error) {
      console.error("Error during retry:", error);
      toast.error("Verification failed");
      setIsVerifying(false);
    }
  };

  // Handle various error states with appropriate UI and actions
  if (error) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 py-20 mt-20">
          <Card className="max-w-md mx-auto p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Unable to Create Listing</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex justify-center gap-4">
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
                <>
                  <Button 
                    onClick={handleRetrySellerVerification}
                    disabled={isVerifying}
                  >
                    {isVerifying ? "Verifying..." : "Retry Verification"}
                  </Button>
                  <Button onClick={() => navigate('/auth')}>
                    Register as Seller
                  </Button>
                </>
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
