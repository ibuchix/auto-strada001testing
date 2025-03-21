
/**
 * Changes made:
 * - 2025-07-14: Created hook to validate seller car listing access
 */

import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";

export const useSellerCarListingValidation = () => {
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
        
        // Step 2: Check seller status
        // Trust metadata first if available
        const hasSellerMetadata = !!session.user?.user_metadata?.role && 
                                 session.user.user_metadata.role === 'seller';
        
        if (!isSeller && !hasSellerMetadata) {
          console.log('SellMyCar: Not recognized as seller, attempting verification');
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
        } else {
          console.log('SellMyCar: Already verified as seller via metadata or state');
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
    } catch (verificationError) {
      console.error("Error during retry:", verificationError);
      toast.error("Verification failed");
      setIsVerifying(false);
    }
  };

  return {
    isValid,
    isLoading,
    error,
    errorType,
    isVerifying,
    handleRetrySellerVerification
  };
};
