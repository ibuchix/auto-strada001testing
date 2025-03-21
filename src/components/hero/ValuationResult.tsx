
/**
 * Changes made:
 * - 2024-11-11: Fixed unresponsive "List This Car" button by addressing JSON parsing issues
 * - 2024-11-11: Improved data passing to the listing form
 * - 2024-11-11: Fixed button click handler to work on both mobile and desktop devices
 * - 2024-11-12: Implemented direct navigation instead of using React Router for more reliable redirect
 * - 2024-11-14: Enhanced seller status handling to prevent 403 Forbidden errors
 * - 2024-11-14: Added fallback mechanism when permission errors occur
 * - 2024-12-05: Completely redesigned navigation flow for maximum reliability with detailed logging
 * - 2024-12-29: Fixed seller verification issues with enhanced error handling and more reliable status checks
 */

import { useAuth } from "@/components/AuthProvider";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ErrorDialog } from "./valuation/components/ErrorDialog";
import { ExistingVehicleDialog } from "./valuation/components/ExistingVehicleDialog";
import { ValuationContent } from "./valuation/components/ValuationContent";

interface ValuationResultProps {
  valuationResult: {
    make: string;
    model: string;
    year: number;
    vin: string;
    transmission: string;
    valuation?: number | null;
    averagePrice?: number | null;
    isExisting?: boolean;
    error?: string;
    rawResponse?: any;
  };
  onContinue: () => void;
  onClose: () => void;
  onRetry?: () => void;
}

export const ValuationResult = ({ 
  valuationResult, 
  onContinue, 
  onClose,
  onRetry 
}: ValuationResultProps) => {
  const { session, isSeller, refreshSellerStatus } = useAuth();
  const navigate = useNavigate();
  
  if (!valuationResult) return null;

  const mileage = parseInt(localStorage.getItem('tempMileage') || '0');
  const hasError = Boolean(valuationResult.error);
  const hasValuation = !hasError && Boolean(valuationResult.averagePrice ?? valuationResult.valuation);
  
  const averagePrice = valuationResult.averagePrice || 0;
  console.log('ValuationResult - Display price:', averagePrice);

  /**
   * Enhanced continue handler with improved seller verification
   */
  const handleContinue = async () => {
    console.log('handleContinue initiated', { isLoggedIn: !!session });
    
    // STEP 1: Check authentication first
    if (!session) {
      console.log('User not authenticated, redirecting to auth page');
      toast.info("Please sign in to continue");
      navigate('/auth');
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
    
    if (!sellerVerified) {
      // First attempt: Use refreshSellerStatus with UI feedback
      toast.loading("Verifying seller status...");
      
      try {
        console.log('Attempting to refresh seller status');
        sellerVerified = await refreshSellerStatus();
        
        if (sellerVerified) {
          console.log('Seller status confirmed via refresh');
          toast.dismiss();
          toast.success("Seller status verified");
        } else {
          // Second attempt: Try manual registration via RPC
          console.log('Not currently a seller, attempting registration via RPC');
          const { error: registerError } = await supabase.rpc('register_seller', {
            p_user_id: session.user.id
          });
          
          if (!registerError) {
            console.log('Successfully registered as seller via RPC');
            toast.dismiss();
            toast.success("Seller account activated");
            sellerVerified = true;
          } else {
            console.error('RPC registration failed:', registerError);
            
            // Last resort: Try one more seller refresh
            sellerVerified = await refreshSellerStatus();
            
            if (!sellerVerified) {
              console.log('All verification methods failed, redirecting to seller registration');
              toast.dismiss();
              navigateToSellerRegistration();
              return;
            }
          }
        }
      } catch (error) {
        console.error('Error verifying seller status:', error);
        toast.dismiss();
        toast.error("Verification failed");
        navigateToSellerRegistration();
        return;
      }
    }
    
    // We only get here if seller is verified
    console.log('Seller status confirmed, proceeding to listing page');
    navigateToListingPage();
  };
  
  /**
   * Handles actual navigation to the listing page
   */
  const navigateToListingPage = () => {
    console.log('Executing navigation to sell-my-car page');
    
    // First close any open dialogs
    onClose();
    
    // Use navigate with replace: true to avoid back button issues
    navigate('/sell-my-car', { replace: true });
    
    // As a fallback, also schedule a direct location change 
    // This helps in rare cases where React Router navigation fails
    setTimeout(() => {
      console.log('Executing fallback direct navigation');
      window.location.href = '/sell-my-car';
    }, 500);
  };
  
  /**
   * Redirects to seller registration
   */
  const navigateToSellerRegistration = () => {
    console.log('Redirecting to seller registration');
    toast.info("Please complete your seller registration");
    navigate('/auth');
  };

  if (hasError && valuationResult.isExisting) {
    return <ExistingVehicleDialog onClose={onClose} onRetry={onRetry} />;
  }

  if (hasError) {
    return (
      <ErrorDialog 
        error={valuationResult.error}
        onClose={onClose}
        onRetry={onRetry}
      />
    );
  }

  return (
    <ValuationContent
      make={valuationResult.make}
      model={valuationResult.model}
      year={valuationResult.year}
      vin={valuationResult.vin}
      transmission={valuationResult.transmission}
      mileage={mileage}
      averagePrice={averagePrice}
      hasValuation={hasValuation}
      isLoggedIn={!!session}
      onClose={onClose}
      onContinue={handleContinue}
    />
  );
};
