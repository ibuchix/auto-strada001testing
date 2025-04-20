
import { Button } from "@/components/ui/button";
import { 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { formatCurrency } from "@/utils/formatters";
import { debugUiRendering } from "@/utils/debugging/enhanced_vin_debugging";
import { ValuationPriceDisplay } from "./ValuationPriceDisplay";

interface ValuationContentProps {
  make: string;
  model: string;
  year: number;
  vin: string;
  transmission: 'manual' | 'automatic';
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
  // Format mileage with "km" suffix
  const formattedMileage = `${mileage.toLocaleString()} km`;
  
  // Enhanced logging to debug display issues
  console.log('ValuationContent rendering with:', {
    make, model, year, vin,
    mileage, transmission,
    reservePrice, averagePrice,
    hasValidReservePrice: reservePrice > 0,
    hasValidAveragePrice: averagePrice > 0,
    hasValuation,
    timestamp: new Date().toISOString()
  });
  
  // Determine if we can show prices - at least one price must be valid OR we have vehicle info
  const shouldShowPrices = hasValuation && (
    // Either we have valid prices
    (reservePrice > 0 || averagePrice > 0) ||
    // Or we have valid vehicle info but no prices (will show fallback message)
    (make && model && year > 0)
  );
  
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
          <div>
            <p className="text-gray-600">VIN:</p>
            <p className="font-semibold text-xs">{vin.toUpperCase() || "N/A"}</p>
          </div>
        </div>
        
        {shouldShowPrices && (
          <ValuationPriceDisplay 
            reservePrice={reservePrice}
            showAveragePrice={true}
            averagePrice={averagePrice}
          />
        )}
        
        <div className="bg-blue-50 p-4 rounded-md mb-6">
          <p className="text-blue-700 font-semibold text-center">
            Your {year} {make} {model} can be listed for auction.
          </p>
        </div>
        
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
        <Button onClick={onContinue} className="w-full bg-DC143C hover:bg-opacity-90">
          List My Car
        </Button>
      </div>
    </DialogContent>
  );
};
