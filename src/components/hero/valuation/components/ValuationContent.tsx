
/**
 * ValuationContent Component
 * Updated: 2025-05-18 - Added price calculation verification feature
 * Updated: 2025-05-20 - Fixed import for ValuationVehicleDetails component
 * Updated: 2025-05-20 - Enhanced price verification with detailed calculation check
 * Updated: 2025-05-21 - Modified to correctly pass base price and calculate reserve price
 * Updated: 2025-05-22 - Ensured mileage is passed to price display component
 * Updated: 2025-05-23 - Removed price verification display as per business requirements
 * Updated: 2025-05-24 - Fixed mileage propagation to child components
 * Updated: 2025-05-25 - Improved button functionality and interactions
 * Updated: 2025-05-26 - Enhanced processing state handling and added detailed logs
 */

import { ValuationPriceDisplay } from "./ValuationPriceDisplay";
import { ValuationVehicleDetails } from "./ValuationVehicleDetails";
// Import but don't use ValuationVerification
import { ValuationVerification } from "./ValuationVerification";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ValuationActions } from "./ValuationActions";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface ValuationContentProps {
  make?: string;
  model?: string;
  year?: number;
  vin?: string;
  transmission?: "manual" | "automatic";
  mileage?: number;
  reservePrice?: number;
  averagePrice?: number;
  hasValuation?: boolean;
  isLoggedIn?: boolean;
  apiSource?: string;
  errorDetails?: string;
  onClose?: () => void;
  onContinue?: () => void;
}

export const ValuationContent = ({
  make,
  model,
  year,
  vin,
  transmission,
  mileage,
  reservePrice,
  averagePrice,
  hasValuation = false,
  isLoggedIn = false,
  apiSource = "auto_iso",
  errorDetails,
  onClose,
  onContinue,
}: ValuationContentProps) => {
  // Check if we have enough data to show content
  const hasRequiredData = !!(make && model && year);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Store valuation data when component mounts
  useEffect(() => {
    if (hasRequiredData && (reservePrice || averagePrice)) {
      // Store the valuation data in localStorage for use in the form
      const valuationData = {
        make,
        model,
        year,
        vin,
        transmission,
        mileage,
        reservePrice,
        valuation: averagePrice, // Store averagePrice as valuation
        averagePrice,
        apiSource,
        timestamp: new Date().toISOString(),
        fromValuation: true
      };
      
      // Save to localStorage
      try {
        localStorage.setItem('valuationData', JSON.stringify(valuationData));
        console.log('ValuationContent: Saved valuation data to localStorage', valuationData);
      } catch (error) {
        console.error('ValuationContent: Error saving valuation data', error);
      }
    }
  }, [make, model, year, vin, transmission, mileage, reservePrice, averagePrice, apiSource, hasRequiredData]);
  
  useEffect(() => {
    console.log("ValuationContent rendering with hasRequiredData:", {
      hasRequiredData,
      isProcessing
    });
  }, [hasRequiredData, isProcessing]);
  
  useEffect(() => {
    console.log("ValuationContent received props:", {
      make,
      model,
      year,
      vin,
      reservePrice,
      averagePrice,
      mileage,
      hasPricingData: !!reservePrice && reservePrice > 0,
      transmission,
      hasValuation,
      isLoggedIn,
      apiSource,
      hasOnContinueHandler: !!onContinue
    });
  }, [make, model, year, vin, reservePrice, averagePrice, transmission, mileage, hasValuation, isLoggedIn, apiSource, onContinue]);

  // Handle continue button click with processing state
  const handleContinue = () => {
    if (onContinue) {
      setIsProcessing(true);
      
      // Add detailed logging for debugging
      console.log("ValuationContent: Continue button clicked", {
        hasHandler: !!onContinue,
        valuationData: {
          make,
          model,
          year,
          vin,
          reservePrice,
          mileage
        },
        timestamp: new Date().toISOString()
      });
      
      // Check if valuation data is in localStorage
      const valuationData = localStorage.getItem('valuationData');
      if (!valuationData) {
        // If not, create it now as a fallback
        const data = {
          make,
          model,
          year,
          vin,
          transmission,
          mileage,
          reservePrice,
          valuation: averagePrice,
          averagePrice,
          apiSource,
          timestamp: new Date().toISOString(),
          fromValuation: true
        };
        
        try {
          localStorage.setItem('valuationData', JSON.stringify(data));
          console.log('ValuationContent: Created valuation data on continue click', data);
        } catch (error) {
          console.error('Error saving valuation data on continue', error);
          toast.error('Failed to save valuation data');
        }
      }
      
      // Call the provided continue handler
      onContinue();
      
      // Reset processing state after a timeout to prevent stuck UI if navigation fails
      setTimeout(() => {
        if (setIsProcessing) {
          setIsProcessing(false);
        }
      }, 5000);
    } else {
      console.error("ValuationContent: No continue handler provided");
      toast.error("Navigation error", {
        description: "Unable to continue to listing form"
      });
    }
  };

  // Handle close button click
  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <Dialog open={hasRequiredData} onOpenChange={() => handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Your Vehicle Valuation</DialogTitle>
          <DialogDescription className="text-center text-xl font-bold mt-2">
            {year} {make?.toUpperCase()} {model?.toUpperCase()}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col space-y-2">
          <ValuationVehicleDetails
            vin={vin}
            transmission={transmission || "manual"}
            mileage={mileage || 0}
          />
          
          <ValuationPriceDisplay
            reservePrice={reservePrice || 0}
            showAveragePrice={false}
            averagePrice={averagePrice} // Pass averagePrice to be used as basePrice
            mileage={mileage} // Explicitly pass mileage to price display
            errorDetails={errorDetails}
            apiSource={apiSource}
          />
          
          {/* ValuationVerification component is no longer rendered */}
        </div>

        <ValuationActions 
          isLoggedIn={isLoggedIn}
          onContinue={handleContinue}
          onClose={handleClose}
          isProcessing={isProcessing}
        />
      </DialogContent>
    </Dialog>
  );
};
