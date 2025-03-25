
/**
 * Changes made:
 * - 2025-07-14: Created hook to validate seller car listing access
 * - 2025-07-21: Fixed error state management to ensure proper clearing of errors
 * - 2027-06-08: Enhanced validation to handle multiple navigation sources and added detailed logging
 */

import { useState, useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";

export const useSellerCarListingValidation = () => {
  const { session, isSeller, refreshSellerStatus } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'auth' | 'data' | 'seller' | null>(null);

  useEffect(() => {
    const validateAndLoadData = async () => {
      try {
        // Start with clean state for each validation attempt
        setError(null);
        setErrorType(null);
        
        const hookId = Math.random().toString(36).substring(2, 8);
        console.log(`ValidationHook[${hookId}] - Starting validation`, { 
          isLoggedIn: !!session, 
          isSeller,
          locationState: location.state,
          hasLocationState: !!location.state,
          fromValuation: !!location.state?.fromValuation,
          fromFallback: searchParams.get('fallback') === 'true',
          fromQueryParam: searchParams.get('from'),
          hasNavigationMarker: localStorage.getItem('navigationInProgress') === 'true',
        });
        
        // Record validation start in localStorage for debugging
        localStorage.setItem('validationStartTime', new Date().toISOString());
        localStorage.setItem('validationHookId', hookId);
        
        // Step 1: Check authentication
        if (!session) {
          console.log(`ValidationHook[${hookId}] - No session found`);
          setError("Please sign in to create a listing");
          setErrorType('auth');
          setIsLoading(false);
          return;
        }
        
        // Step 2: Check seller status
        // Trust metadata first if available
        const hasSellerMetadata = !!session.user?.user_metadata?.role && 
                                 session.user.user_metadata.role === 'seller';
        
        console.log(`ValidationHook[${hookId}] - Seller status check`, {
          isSeller,
          hasSellerMetadata,
          userMetadata: session.user?.user_metadata
        });
        
        if (!isSeller && !hasSellerMetadata) {
          console.log(`ValidationHook[${hookId}] - Not recognized as seller, attempting verification`);
          setIsVerifying(true);
          
          // Show verifying toast with auto-dismiss
          const toastId = toast.loading("Verifying seller status...");
          setTimeout(() => toast.dismiss(toastId), 3000);
          
          const sellerStatus = await refreshSellerStatus();
          setIsVerifying(false);
          
          if (!sellerStatus) {
            console.log(`ValidationHook[${hookId}] - Not a seller`);
            setError("Please register as a seller to list your car");
            setErrorType('seller');
            setIsLoading(false);
            return;
          } else {
            console.log(`ValidationHook[${hookId}] - Successfully verified as seller`);
            toast.success("Seller status verified");
          }
        } else {
          console.log(`ValidationHook[${hookId}] - Already verified as seller via metadata or state`);
        }
        
        // Step 3: Try to get data from multiple sources in priority order
        
        // Priority 1: Location state (from direct navigation)
        const stateData = location.state?.valuationData;
        let hasValidData = false;
        
        if (stateData) {
          console.log(`ValidationHook[${hookId}] - Using data from location state:`, {
            make: stateData.make,
            model: stateData.model,
            hasVin: !!stateData.vin,
            fromSource: 'location.state'
          });
          
          // If we have data from navigation state, make sure it's also in localStorage
          localStorage.setItem('valuationData', JSON.stringify(stateData));
          
          if (stateData.vin) {
            localStorage.setItem('tempVIN', stateData.vin);
            hasValidData = true;
          }
          
          if (stateData.mileage) {
            localStorage.setItem('tempMileage', stateData.mileage.toString());
          }
          
          if (location.state?.fromValuation) {
            console.log(`ValidationHook[${hookId}] - Valid navigation from valuation confirmed`);
            setIsValid(true);
            setIsLoading(false);
            // Explicitly reset error state to ensure it's cleared
            setError(null);
            setErrorType(null);
            return;
          }
        }
        
        // Priority 2: URL parameters (fallback navigation)
        if (!hasValidData && (searchParams.get('from') === 'valuation' || searchParams.get('fallback') === 'true')) {
          console.log(`ValidationHook[${hookId}] - URL indicates navigation from valuation, checking localStorage`);
          
          const storedData = localStorage.getItem('valuationData');
          const tempVIN = localStorage.getItem('tempVIN');
          
          if (storedData && tempVIN) {
            console.log(`ValidationHook[${hookId}] - Found valid data in localStorage via URL parameters`);
            hasValidData = true;
          }
        }
        
        // Priority 3: localStorage as last resort
        if (!hasValidData) {
          console.log(`ValidationHook[${hookId}] - Checking localStorage for data`);
          const tempVIN = localStorage.getItem("tempVIN");
          const tempMileage = localStorage.getItem("tempMileage");
          
          if (tempVIN) {
            console.log(`ValidationHook[${hookId}] - Found VIN in localStorage: ${tempVIN.substring(0, 4)}...`);
            hasValidData = true;
          }
          
          if (!tempVIN || !tempMileage) {
            console.log(`ValidationHook[${hookId}] - Missing essential data in localStorage`);
          }
        }
        
        // Check if we have any valid data to proceed
        if (!hasValidData) {
          console.log(`ValidationHook[${hookId}] - No valid data found from any source`);
          setError("Missing vehicle information. Please complete a valuation first.");
          setErrorType('data');
          setIsLoading(false);
          return;
        }
        
        // At this point, we have valid data in some form, try to parse full valuation data if possible
        try {
          const valuationDataStr = localStorage.getItem("valuationData");
          if (valuationDataStr) {
            const valuationData = JSON.parse(valuationDataStr);
            console.log(`ValidationHook[${hookId}] - Parsed valuation data successfully`, {
              make: valuationData.make,
              model: valuationData.model,
              year: valuationData.year
            });
          } else {
            console.warn(`ValidationHook[${hookId}] - No full valuation data found, but continuing with basic info`);
            toast.info("Limited vehicle data available. Some fields may need manual entry.");
          }
        } catch (parseError) {
          console.error(`ValidationHook[${hookId}] - Error parsing valuation data:`, parseError);
          // Continue anyway - this isn't a showstopper
          toast.info("Some vehicle data could not be loaded. Manual entry may be required.");
        }
        
        // All checks passed - allow the form to display
        console.log(`ValidationHook[${hookId}] - All validation passed`);
        // Explicitly set valid state and clear any errors
        setIsValid(true);
        setError(null);
        setErrorType(null);
        setIsLoading(false);
        
        // Record validation success
        localStorage.setItem('validationSuccessTime', new Date().toISOString());
      } catch (error) {
        console.error('ValidationHook - Unexpected error during validation:', error);
        setError("An unexpected error occurred. Please try again.");
        setIsLoading(false);
      }
    };

    validateAndLoadData();
  }, [session, isSeller, navigate, refreshSellerStatus, location, searchParams]);

  // Retry seller verification manually
  const handleRetrySellerVerification = async () => {
    setIsVerifying(true);
    toast.loading("Retrying seller verification...");
    
    try {
      const result = await refreshSellerStatus();
      setIsVerifying(false);
      
      if (result) {
        toast.success("Seller verification successful!");
        // Explicitly reset error state on success
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
