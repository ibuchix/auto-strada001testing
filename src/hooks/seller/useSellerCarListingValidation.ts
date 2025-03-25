
/**
 * Changes made:
 * - 2025-07-14: Created hook to validate seller car listing access
 * - 2025-07-21: Fixed error state management to ensure proper clearing of errors
 * - 2027-06-08: Enhanced validation to handle multiple navigation sources and added detailed logging
 * - 2027-06-15: Added comprehensive validation diagnostics and performance metrics
 */

import { useState, useEffect, useRef } from "react";
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
  
  // Track validation performance
  const validationMetrics = useRef<{
    startTime?: number;
    authStepComplete?: number;
    sellerStepComplete?: number;
    dataStepComplete?: number;
    completeTime?: number;
    attempts: number;
    hookId: string;
  }>({
    attempts: 0,
    hookId: Math.random().toString(36).substring(2, 8)
  });

  useEffect(() => {
    const validateAndLoadData = async () => {
      try {
        // Track attempt count
        validationMetrics.current.attempts += 1;
        const attemptCount = validationMetrics.current.attempts;
        
        // Start with clean state for each validation attempt
        setError(null);
        setErrorType(null);
        
        // Track validation start time
        const startTime = performance.now();
        validationMetrics.current.startTime = startTime;
        
        const hookId = validationMetrics.current.hookId;
        console.log(`ValidationHook[${hookId}] - Starting validation attempt #${attemptCount}`, { 
          isLoggedIn: !!session, 
          isSeller,
          hookId,
          startTime,
          
          // Navigation context
          locationState: location.state,
          hasLocationState: !!location.state,
          locationStateKeys: location.state ? Object.keys(location.state) : [],
          fromValuation: !!location.state?.fromValuation,
          fromFallback: searchParams.get('fallback') === 'true',
          fromEmergency: searchParams.get('emergency') === 'true',
          fromQueryParam: searchParams.get('from'),
          navId: searchParams.get('navId') || location.state?.navId || 'unknown',
          
          // Navigation tracking
          hasNavigationMarker: localStorage.getItem('navigationInProgress') === 'true',
          navigationStartTime: localStorage.getItem('navigationStartTime'),
          
          // Current URL info
          pathname: location.pathname,
          search: location.search,
          hash: location.hash,
          
          // Performance data
          performanceNow: performance.now(),
          performanceNavigation: performance.navigation ? {
            type: performance.navigation.type,
            redirectCount: performance.navigation.redirectCount
          } : 'Not available'
        });
        
        // Record validation start in localStorage for debugging
        try {
          localStorage.setItem('validationStartTime', new Date().toISOString());
          localStorage.setItem('validationHookId', hookId);
          localStorage.setItem('validationAttempt', attemptCount.toString());
        } catch (storageError) {
          console.warn(`ValidationHook[${hookId}] - Failed to write to localStorage:`, storageError);
        }
        
        // Step 1: Check authentication
        console.log(`ValidationHook[${hookId}] - Step 1: Checking authentication`);
        if (!session) {
          console.log(`ValidationHook[${hookId}] - No session found`);
          const authCompleteTime = performance.now();
          validationMetrics.current.authStepComplete = authCompleteTime;
          console.log(`ValidationHook[${hookId}] - Auth check failed in ${authCompleteTime - startTime}ms`);
          
          setError("Please sign in to create a listing");
          setErrorType('auth');
          setIsLoading(false);
          
          // Record validation failure
          try {
            localStorage.setItem('validationResult', 'failed-auth');
            localStorage.setItem('validationCompleteTime', new Date().toISOString());
            localStorage.setItem('validationDuration', (authCompleteTime - startTime).toString());
          } catch (e) {}
          
          return;
        }
        
        // Record successful auth check
        const authCompleteTime = performance.now();
        validationMetrics.current.authStepComplete = authCompleteTime;
        console.log(`ValidationHook[${hookId}] - Auth check passed in ${authCompleteTime - startTime}ms`);
        
        // Step 2: Check seller status
        console.log(`ValidationHook[${hookId}] - Step 2: Checking seller status`);
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
          
          try {
            const sellerStatus = await refreshSellerStatus();
            setIsVerifying(false);
            
            const sellerCheckCompleteTime = performance.now();
            validationMetrics.current.sellerStepComplete = sellerCheckCompleteTime;
            console.log(`ValidationHook[${hookId}] - Seller verification took ${sellerCheckCompleteTime - authCompleteTime}ms, result:`, sellerStatus);
            
            if (!sellerStatus) {
              console.log(`ValidationHook[${hookId}] - Not a seller`);
              setError("Please register as a seller to list your car");
              setErrorType('seller');
              setIsLoading(false);
              
              // Record validation failure
              try {
                localStorage.setItem('validationResult', 'failed-seller');
                localStorage.setItem('validationCompleteTime', new Date().toISOString());
                localStorage.setItem('validationDuration', (sellerCheckCompleteTime - startTime).toString());
              } catch (e) {}
              
              return;
            } else {
              console.log(`ValidationHook[${hookId}] - Successfully verified as seller`);
              toast.success("Seller status verified");
            }
          } catch (verificationError) {
            console.error(`ValidationHook[${hookId}] - Error during seller verification:`, verificationError);
            const errorTime = performance.now();
            console.log(`ValidationHook[${hookId}] - Seller verification error after ${errorTime - authCompleteTime}ms`);
            
            setIsVerifying(false);
            setError("Error verifying seller status. Please try again.");
            setErrorType('seller');
            setIsLoading(false);
            
            // Record validation error
            try {
              localStorage.setItem('validationResult', 'error-seller');
              localStorage.setItem('validationCompleteTime', new Date().toISOString());
              localStorage.setItem('validationDuration', (errorTime - startTime).toString());
              localStorage.setItem('validationError', (verificationError as Error).message || 'Unknown error');
            } catch (e) {}
            
            return;
          }
        } else {
          console.log(`ValidationHook[${hookId}] - Already verified as seller via metadata or state`);
          validationMetrics.current.sellerStepComplete = performance.now();
        }
        
        const sellerStepTime = validationMetrics.current.sellerStepComplete! - validationMetrics.current.authStepComplete!;
        console.log(`ValidationHook[${hookId}] - Seller step completed in ${sellerStepTime}ms`);
        
        // Step 3: Try to get data from multiple sources in priority order
        console.log(`ValidationHook[${hookId}] - Step 3: Checking for vehicle data`);
        
        // Priority 1: Location state (from direct navigation)
        const stateData = location.state?.valuationData;
        let hasValidData = false;
        let dataSource = 'none';
        
        if (stateData) {
          console.log(`ValidationHook[${hookId}] - Examining data from location state:`, {
            make: stateData.make,
            model: stateData.model,
            hasVin: !!stateData.vin,
            fromSource: 'location.state',
            stateDataKeys: Object.keys(stateData)
          });
          
          // If we have data from navigation state, make sure it's also in localStorage
          try {
            localStorage.setItem('valuationData', JSON.stringify(stateData));
            
            if (stateData.vin) {
              localStorage.setItem('tempVIN', stateData.vin);
              hasValidData = true;
              dataSource = 'location.state';
            }
            
            if (stateData.mileage) {
              localStorage.setItem('tempMileage', stateData.mileage.toString());
            }
          } catch (storageError) {
            console.warn(`ValidationHook[${hookId}] - Error storing state data in localStorage:`, storageError);
          }
          
          if (location.state?.fromValuation) {
            console.log(`ValidationHook[${hookId}] - Valid navigation from valuation confirmed`);
            const dataStepCompleteTime = performance.now();
            validationMetrics.current.dataStepComplete = dataStepCompleteTime;
            
            console.log(`ValidationHook[${hookId}] - Data validation took ${dataStepCompleteTime - validationMetrics.current.sellerStepComplete!}ms`);
            
            setIsValid(true);
            setIsLoading(false);
            // Explicitly reset error state to ensure it's cleared
            setError(null);
            setErrorType(null);
            
            // Record successful validation
            const completeTime = performance.now();
            validationMetrics.current.completeTime = completeTime;
            
            try {
              localStorage.setItem('validationResult', 'success-state');
              localStorage.setItem('validationCompleteTime', new Date().toISOString());
              localStorage.setItem('validationDuration', (completeTime - startTime).toString());
              localStorage.setItem('validationDataSource', dataSource);
            } catch (e) {}
            
            return;
          }
        }
        
        // Priority 2: URL parameters (fallback navigation)
        if (!hasValidData && (searchParams.get('from') === 'valuation' || searchParams.get('fallback') === 'true' || searchParams.get('emergency') === 'true')) {
          console.log(`ValidationHook[${hookId}] - URL indicates navigation from valuation, checking localStorage`);
          
          const storedData = localStorage.getItem('valuationData');
          const tempVIN = localStorage.getItem('tempVIN');
          
          if (storedData && tempVIN) {
            console.log(`ValidationHook[${hookId}] - Found valid data in localStorage via URL parameters`, {
              tempVIN: tempVIN.substring(0, 4) + '...',
              storedDataLength: storedData.length
            });
            
            hasValidData = true;
            dataSource = 'url_params_with_localStorage';
            
            // Try to parse the stored data to verify it's valid
            try {
              const parsedData = JSON.parse(storedData);
              console.log(`ValidationHook[${hookId}] - Successfully parsed localStorage data`, {
                make: parsedData.make,
                model: parsedData.model,
                hasVin: !!parsedData.vin,
                parsedDataKeys: Object.keys(parsedData)
              });
            } catch (parseError) {
              console.warn(`ValidationHook[${hookId}] - Error parsing localStorage data:`, parseError);
              // Continue anyway since we have the VIN
            }
          }
        }
        
        // Priority 3: localStorage as last resort
        if (!hasValidData) {
          console.log(`ValidationHook[${hookId}] - Checking localStorage for data as last resort`);
          const tempVIN = localStorage.getItem("tempVIN");
          const tempMileage = localStorage.getItem("tempMileage");
          
          if (tempVIN) {
            console.log(`ValidationHook[${hookId}] - Found VIN in localStorage: ${tempVIN.substring(0, 4)}...`);
            hasValidData = true;
            dataSource = 'localStorage_only';
          }
          
          if (!tempVIN || !tempMileage) {
            console.log(`ValidationHook[${hookId}] - Missing essential data in localStorage`);
          }
        }
        
        // Record data validation complete time
        const dataStepCompleteTime = performance.now();
        validationMetrics.current.dataStepComplete = dataStepCompleteTime;
        
        console.log(`ValidationHook[${hookId}] - Data validation took ${dataStepCompleteTime - validationMetrics.current.sellerStepComplete!}ms`);
        
        // Check if we have any valid data to proceed
        if (!hasValidData) {
          console.log(`ValidationHook[${hookId}] - No valid data found from any source`);
          setError("Missing vehicle information. Please complete a valuation first.");
          setErrorType('data');
          setIsLoading(false);
          
          // Record validation failure
          const completeTime = performance.now();
          validationMetrics.current.completeTime = completeTime;
          
          try {
            localStorage.setItem('validationResult', 'failed-data');
            localStorage.setItem('validationCompleteTime', new Date().toISOString());
            localStorage.setItem('validationDuration', (completeTime - startTime).toString());
          } catch (e) {}
          
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
              year: valuationData.year,
              dataSource
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
        const completeTime = performance.now();
        validationMetrics.current.completeTime = completeTime;
        
        try {
          localStorage.setItem('validationResult', 'success-' + dataSource);
          localStorage.setItem('validationCompleteTime', new Date().toISOString());
          localStorage.setItem('validationDuration', (completeTime - startTime).toString());
          localStorage.setItem('validationDataSource', dataSource);
          
          // Store timing metrics
          localStorage.setItem('validationMetrics', JSON.stringify({
            totalTime: completeTime - startTime,
            authTime: validationMetrics.current.authStepComplete! - startTime,
            sellerTime: validationMetrics.current.sellerStepComplete! - validationMetrics.current.authStepComplete!,
            dataTime: validationMetrics.current.dataStepComplete! - validationMetrics.current.sellerStepComplete!,
            attemptCount: validationMetrics.current.attempts
          }));
        } catch (e) {}
        
        console.log(`ValidationHook[${hookId}] - Validation completed in ${completeTime - startTime}ms`);
      } catch (error) {
        console.error('ValidationHook - Unexpected error during validation:', error);
        setError("An unexpected error occurred. Please try again.");
        setIsLoading(false);
        
        // Record validation error
        try {
          localStorage.setItem('validationResult', 'unexpected-error');
          localStorage.setItem('validationCompleteTime', new Date().toISOString());
          localStorage.setItem('validationError', (error as Error).message || 'Unknown error');
        } catch (e) {}
      }
    };

    validateAndLoadData();
  }, [session, isSeller, navigate, refreshSellerStatus, location, searchParams]);

  // Retry seller verification manually
  const handleRetrySellerVerification = async () => {
    setIsVerifying(true);
    toast.loading("Retrying seller verification...");
    
    const startRetryTime = performance.now();
    const retryId = Math.random().toString(36).substring(2, 8);
    console.log(`ValidationHook - Starting retry verification ${retryId}`);
    
    try {
      localStorage.setItem('retrySellerVerification', 'true');
      localStorage.setItem('retrySellerVerificationTime', new Date().toISOString());
      localStorage.setItem('retryId', retryId);
      
      const result = await refreshSellerStatus();
      setIsVerifying(false);
      
      const retryCompleteTime = performance.now();
      const retryDuration = retryCompleteTime - startRetryTime;
      
      console.log(`ValidationHook - Retry verification ${retryId} completed in ${retryDuration}ms with result:`, result);
      
      if (result) {
        toast.success("Seller verification successful!");
        // Explicitly reset error state on success
        setError(null);
        setErrorType(null);
        setIsValid(true);
        
        localStorage.setItem('retryResult', 'success');
        localStorage.setItem('retryDuration', retryDuration.toString());
      } else {
        toast.error("Still unable to verify seller status");
        localStorage.setItem('retryResult', 'failed');
        localStorage.setItem('retryDuration', retryDuration.toString());
      }
    } catch (verificationError) {
      console.error("Error during retry:", verificationError);
      toast.error("Verification failed");
      setIsVerifying(false);
      
      const retryErrorTime = performance.now();
      
      localStorage.setItem('retryResult', 'error');
      localStorage.setItem('retryDuration', (retryErrorTime - startRetryTime).toString());
      localStorage.setItem('retryError', (verificationError as Error).message || 'Unknown error');
    }
  };

  return {
    isValid,
    isLoading,
    error,
    errorType,
    isVerifying,
    handleRetrySellerVerification,
    validationMetrics: validationMetrics.current
  };
};
