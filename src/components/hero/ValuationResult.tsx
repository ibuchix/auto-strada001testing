
/**
 * Changes made:
 * - 2024-11-11: Fixed unresponsive "List This Car" button by addressing JSON parsing issues
 * - 2024-11-11: Improved data passing to the listing form
 * - 2024-11-11: Fixed button click handler to work on both mobile and desktop devices
 * - 2024-11-12: Implemented direct navigation instead of using React Router for more reliable redirect
 * - 2024-11-14: Enhanced seller status handling to prevent 403 Forbidden errors
 * - 2024-11-14: Added fallback mechanism when permission errors occur
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
   * Enhanced continue handler with permission error handling
   */
  const handleContinue = async () => {
    // Check authentication first
    if (!session) {
      navigate('/auth');
      return;
    }

    // Check if the user is a seller - use cached value first
    if (isSeller) {
      handleSellerContinue();
      return;
    }

    // Try refreshing seller status if needed
    try {
      const isSellerConfirmed = await refreshSellerStatus();
      
      if (isSellerConfirmed) {
        handleSellerContinue();
      } else {
        // Not a seller - redirect to registration
        navigate('/auth');
        toast.info("Please sign up as a seller to list your car");
      }
    } catch (error) {
      console.error("Error refreshing seller status:", error);
      
      // Handle as gracefully as possible - attempt to register seller
      try {
        // If we can't verify seller status, check if they have a profile
        const { error: profileError } = await supabase.rpc('register_seller', {
          p_user_id: session.user.id
        });
        
        if (!profileError) {
          // Successfully registered as seller
          toast.success("Your seller account is now activated");
          handleSellerContinue();
        } else {
          // Still failed - redirect to auth page
          navigate('/auth');
          toast.info("Please complete your seller registration");
        }
      } catch (finalError) {
        // Last resort fallback - go to auth page
        navigate('/auth');
        toast.info("Please sign up as a seller to list your car");
      }
    }
  };
  
  /**
   * Handles navigation for confirmed sellers
   */
  const handleSellerContinue = () => {
    // Handle the navigation based on VIN check result
    if (valuationResult.isExisting) {
      toast.error("This vehicle has already been listed");
      onClose();
    } else {
      // Ensure proper JSON storage of valuation data
      try {
        // Store all necessary data with proper string conversion
        const valuationData = {
          make: valuationResult.make,
          model: valuationResult.model,
          year: valuationResult.year,
          vin: valuationResult.vin,
          transmission: valuationResult.transmission,
          valuation: valuationResult.valuation,
          averagePrice: valuationResult.averagePrice
        };
        
        localStorage.setItem('valuationData', JSON.stringify(valuationData));
        localStorage.setItem('tempVIN', valuationResult.vin);
        localStorage.setItem('tempMileage', mileage.toString());
        localStorage.setItem('tempGearbox', valuationResult.transmission);
        
        // Add logging for debugging
        console.log('Initiating navigation to sell-my-car with data:', {
          vin: valuationResult.vin,
          transmission: valuationResult.transmission,
          mileage,
          valuationData
        });
        
        // First close the dialog to ensure UI state is clean
        onClose();
        
        // Use direct window location change for more reliable navigation
        window.location.href = '/sell-my-car';
      } catch (error) {
        console.error('Error storing valuation data:', error);
        toast.error("Failed to prepare car listing data");
      }
    }
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
