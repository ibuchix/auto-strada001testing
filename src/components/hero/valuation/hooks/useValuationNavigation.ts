
/**
 * Changes made:
 * - 2025-04-21: Created dedicated hook for valuation navigation logic extracted from ValuationResult
 */

import { useAuth } from "@/components/AuthProvider";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCallback } from "react";

interface ValuationData {
  make: string;
  model: string;
  year: number;
  vin: string;
  transmission: string;
  valuation?: number | null;
  averagePrice?: number | null;
}

export const useValuationNavigation = () => {
  const { session, isSeller, refreshSellerStatus } = useAuth();
  const navigate = useNavigate();
  
  /**
   * Enhanced continue handler with improved seller verification and navigation reliability
   */
  const handleContinue = useCallback(async (valuationResult: ValuationData, mileage: number) => {
    console.log('handleContinue initiated', { 
      isLoggedIn: !!session,
      isSeller: isSeller,
      timestamp: new Date().toISOString()
    });
    
    // STEP 1: Check authentication first
    if (!session) {
      console.log('User not authenticated, redirecting to auth page');
      toast.info("Please sign in to continue");
      
      // Use a more reliable navigation pattern
      setTimeout(() => {
        navigate('/auth', { replace: true });
      }, 100);
      return;
    }

    // STEP 2: Store the valuation data in localStorage with better error handling
    try {
      console.log('Saving valuation data to localStorage');
      
      // Create a clean data object without circular references
      const valuationData = {
        make: valuationResult.make,
        model: valuationResult.model,
        year: valuationResult.year,
        vin: valuationResult.vin,
        transmission: valuationResult.transmission,
        valuation: valuationResult.valuation,
        averagePrice: valuationResult.averagePrice
      };
      
      // Store all data pieces individually to reduce potential JSON errors
      localStorage.setItem('valuationData', JSON.stringify(valuationData));
      localStorage.setItem('tempVIN', valuationResult.vin);
      localStorage.setItem('tempMileage', mileage.toString());
      localStorage.setItem('tempGearbox', valuationResult.transmission);
      localStorage.setItem('listingTimestamp', new Date().toISOString());
      localStorage.setItem('navigationSource', 'valuation_result');
      
      console.log('Successfully saved valuation data');
    } catch (error) {
      console.error('Failed to save valuation data:', error);
      toast.error("Error preparing car data", { 
        description: "Please try again or contact support."
      });
      return;
    }

    // STEP 3: Check seller status and handle navigation with retries
    console.log('Starting seller status verification', { currentStatus: isSeller });
    
    let sellerVerified = isSeller;
    let verificationAttempts = 0;
    const MAX_VERIFICATION_ATTEMPTS = 2;
    
    if (!sellerVerified) {
      // First attempt: Use refreshSellerStatus with UI feedback
      const verificationToastId = toast.loading("Verifying seller status...");
      
      try {
        console.log('Attempting to refresh seller status');
        verificationAttempts++;
        sellerVerified = await refreshSellerStatus();
        
        if (sellerVerified) {
          console.log('Seller status confirmed via refresh');
          toast.dismiss(verificationToastId);
          toast.success("Seller status verified");
        } else {
          // Second attempt: Try manual registration via RPC
          console.log('Not currently a seller, attempting registration via RPC');
          verificationAttempts++;
          
          const { error: registerError } = await supabase.rpc('register_seller', {
            p_user_id: session.user.id
          });
          
          if (!registerError) {
            console.log('Successfully registered as seller via RPC');
            toast.dismiss(verificationToastId);
            toast.success("Seller account activated");
            sellerVerified = true;
            
            // Force refresh the seller status after successful RPC
            await refreshSellerStatus();
          } else {
            console.error('RPC registration failed:', registerError);
            
            // One final attempt if we haven't reached max attempts
            if (verificationAttempts < MAX_VERIFICATION_ATTEMPTS) {
              console.log(`Attempt ${verificationAttempts+1}: Final seller refresh`);
              verificationAttempts++;
              sellerVerified = await refreshSellerStatus();
            }
            
            if (!sellerVerified) {
              console.log('All verification methods failed, redirecting to seller registration');
              toast.dismiss(verificationToastId);
              navigateToSellerRegistration();
              return;
            }
          }
        }
      } catch (error) {
        console.error('Error verifying seller status:', error);
        toast.dismiss(verificationToastId);
        toast.error("Verification failed");
        navigateToSellerRegistration();
        return;
      }
    }
    
    // We only get here if seller is verified
    console.log('Seller status confirmed, proceeding to listing page');
    navigateToListingPage();
  }, [session, isSeller, refreshSellerStatus, navigate]);
  
  /**
   * Handles actual navigation to the listing page with fallback
   */
  const navigateToListingPage = useCallback(() => {
    console.log('Executing navigation to sell-my-car page');
    
    // Set a navigation flag for debugging
    localStorage.setItem('navigationAttempt', new Date().toISOString());
    
    // Primary navigation - using React Router with history replacement
    try {
      navigate('/sell-my-car', { replace: true });
      console.log('React Router navigation executed');
    } catch (error) {
      console.error('React Router navigation failed:', error);
      
      // Secondary fallback - direct location change after a short delay
      setTimeout(() => {
        console.log('Executing fallback direct navigation');
        try {
          window.location.href = '/sell-my-car';
        } catch (error) {
          console.error('Direct navigation failed:', error);
          window.location.replace('/sell-my-car');
        }
      }, 300);
    }
  }, [navigate]);
  
  /**
   * Redirects to seller registration with improved reliability
   */
  const navigateToSellerRegistration = useCallback(() => {
    console.log('Redirecting to seller registration');
    
    // Show toast with delay to ensure it appears
    setTimeout(() => {
      toast.info("Please complete your seller registration");
    }, 100);
    
    // Use primary navigation
    try {
      navigate('/auth', { replace: true });
    } catch (error) {
      console.error('Navigation to auth failed:', error);
      
      // Fallback
      setTimeout(() => {
        window.location.href = '/auth';
      }, 200);
    }
  }, [navigate]);
  
  return {
    handleContinue,
    navigateToListingPage,
    navigateToSellerRegistration,
    isLoggedIn: !!session
  };
};
