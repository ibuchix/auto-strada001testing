
/**
 * Changes made:
 * - 2024-03-19: Initial implementation of valuation result display
 * - 2024-03-19: Added user authentication checks
 * - 2024-03-19: Implemented seller role validation
 * - 2024-03-19: Updated to pass reserve price to ValuationDisplay
 * - 2024-03-19: Refactored into smaller components
 * - 2024-03-19: Fixed type error in props passed to ValuationContent
 * - 2024-03-19: Added averagePrice to ValuationContent props
 * - 2024-03-19: Fixed valuation data being passed incorrectly
 * - 2024-08-05: Enhanced error handling and improved manual valuation flow
 * - 2024-10-28: Added support for seller context
 */

import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ErrorDialog } from "./ErrorDialog";
import { ExistingVehicleDialog } from "./dialogs/ExistingVehicleDialog";
import { ValuationContent } from "./ValuationContent";
import { useValuationContinue } from "../hooks/useValuationContinue";
import { useAuth } from "@/components/AuthProvider";

interface ValuationResultProps {
  valuationResult: {
    make: string;
    model: string;
    year: number;
    vin: string;
    transmission: string;
    valuation?: number;
    averagePrice?: number;
    reservePrice?: number;
    isExisting?: boolean;
    error?: string;
    noData?: boolean;
  };
  onContinue: () => void;
  onClose: () => void;
  onRetry?: () => void;
  context?: 'home' | 'seller';
}

export const ValuationResult = ({ 
  valuationResult, 
  onContinue, 
  onClose,
  onRetry,
  context = 'home'
}: ValuationResultProps) => {
  const navigate = useNavigate();
  const { session, isSeller, refreshSellerStatus } = useAuth();
  
  if (!valuationResult) return null;

  const mileage = parseInt(localStorage.getItem('tempMileage') || '0');
  const hasError = !!valuationResult.error;
  const hasValuation = !hasError && !!(valuationResult.valuation || valuationResult.averagePrice);

  const handleContinue = async () => {
    if (!session) {
      navigate('/auth');
      return;
    }

    // For seller context, ensure they have seller role
    if (context === 'seller') {
      // If isSeller is already true, proceed without checking database
      if (isSeller) {
        handleSellerContinue();
        return;
      }

      // Refresh seller status to ensure we have the latest information
      const isSellerConfirmed = await refreshSellerStatus();
      
      if (isSellerConfirmed) {
        handleSellerContinue();
      } else {
        navigate('/auth');
        toast.info("Please sign up as a seller to list your car");
      }
    } else {
      // For home context, just use the standard continuation
      onContinue();
    }
  };
  
  const handleSellerContinue = () => {
    // Handle the navigation based on VIN check result
    if (valuationResult.isExisting) {
      toast.error("This vehicle has already been listed");
      onClose();
    } else {
      navigate('/sell-my-car', { 
        state: { 
          fromValuation: true,
          valuationData: valuationResult
        }
      });
    }
  };

  if (hasError && valuationResult.isExisting) {
    return <ExistingVehicleDialog onClose={onClose} onRetry={onRetry} />;
  }

  if (hasError || valuationResult.noData) {
    // Prepare the error message
    const errorMessage = valuationResult.error || 
      "No data found for this VIN. Would you like to proceed with manual valuation?";
    
    return (
      <ErrorDialog 
        error={errorMessage}
        onClose={onClose}
        onRetry={onRetry}
        showManualOption={true}
        onManualValuation={() => {
          // Store the VIN and other data in localStorage for the manual form
          if (valuationResult.vin) {
            localStorage.setItem('tempVIN', valuationResult.vin);
          }
          if (mileage) {
            localStorage.setItem('tempMileage', mileage.toString());
          }
          if (valuationResult.transmission) {
            localStorage.setItem('tempGearbox', valuationResult.transmission);
          }
          
          if (!session) {
            navigate('/auth');
            toast.info("Please sign in first", {
              description: "Create an account or sign in to continue with manual valuation.",
            });
          } else {
            navigate('/manual-valuation');
          }
        }}
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
      reservePrice={valuationResult.reservePrice || valuationResult.valuation}
      averagePrice={valuationResult.averagePrice}
      hasValuation={hasValuation}
      isLoggedIn={!!session}
      onClose={onClose}
      onContinue={handleContinue}
    />
  );
};
