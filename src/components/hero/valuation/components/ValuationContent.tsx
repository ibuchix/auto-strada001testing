
/**
 * Changes made:
 * - 2025-04-22: Added better display of vehicle information with formatting
 * - 2025-04-22: Added fallback displays and debugging information
 */

import { Button } from "@/components/ui/button";
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency } from "@/utils/formatters";

interface ValuationContentProps {
  make: string;
  model: string;
  year: number;
  vin: string;
  transmission: string;
  mileage: number;
  reservePrice: number;
  averagePrice: number;
  hasValuation: boolean;
  isLoggedIn: boolean;
  onClose: () => void;
  onContinue: () => void;
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
  hasValuation,
  isLoggedIn,
  onClose,
  onContinue,
}: ValuationContentProps) => {
  // Log props for debugging
  console.log("ValuationContent props:", {
    make, model, year, transmission, 
    mileage, reservePrice, averagePrice, 
    hasValuation
  });
  
  // Format mileage with "km" suffix
  const formattedMileage = `${mileage.toLocaleString()} km`;
  
  // Format prices with proper currency
  const formattedReservePrice = reservePrice ? formatCurrency(reservePrice) : "N/A";
  const formattedAveragePrice = averagePrice ? formatCurrency(averagePrice) : "N/A";
  
  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold text-center">Valuation Result</DialogTitle>
      </DialogHeader>
      
      <div className="py-4">
        <h3 className="text-xl font-semibold text-center my-4">Vehicle Information</h3>
        
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-gray-600">Make:</p>
            <p className="font-semibold">{make || "Unknown"}</p>
          </div>
          <div>
            <p className="text-gray-600">Model:</p>
            <p className="font-semibold">{model || "Unknown"}</p>
          </div>
          <div>
            <p className="text-gray-600">Year:</p>
            <p className="font-semibold">{year || "N/A"}</p>
          </div>
          <div>
            <p className="text-gray-600">Transmission:</p>
            <p className="font-semibold">{transmission}</p>
          </div>
          <div>
            <p className="text-gray-600">Mileage:</p>
            <p className="font-semibold">{formattedMileage}</p>
          </div>
          {/* Add VIN information for verification */}
          <div>
            <p className="text-gray-600">VIN:</p>
            <p className="font-semibold text-xs">{vin.toUpperCase() || "N/A"}</p>
          </div>
        </div>
        
        {hasValuation && (
          <div className="bg-blue-50 p-4 rounded-md mb-6">
            <p className="text-blue-700 font-semibold text-center">
              Great news! Your {year} {make} {model} can be listed for auction.
            </p>
          </div>
        )}
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">What happens next?</h3>
          <p className="text-gray-700">
            Our platform will guide you through listing your car. After 
            submission, our team will review your listing before it goes live 
            for certified dealers to bid on.
          </p>
          <p className="text-gray-700 mt-4">
            You can always call us at +48 123 456 789 if you have any questions.
          </p>
        </div>
      </div>
      
      <div className="flex justify-between gap-4">
        <Button variant="outline" onClick={onClose} className="w-full">
          Close
        </Button>
        {hasValuation && (
          <Button onClick={onContinue} className="w-full bg-DC143C hover:bg-opacity-90">
            List My Car
          </Button>
        )}
      </div>
    </DialogContent>
  );
};
