
/**
 * Changes made:
 * - 2024-03-19: Fixed props passed to ValuationDisplay
 */

import { 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { ValuationDisplay } from "./ValuationDisplay";
import { VehicleDetails } from "./VehicleDetails";

interface ValuationContentProps {
  make: string;
  model: string;
  year: number;
  transmission: string;
  mileage: number;
  reservePrice?: number;
}

export const ValuationContent = ({
  make,
  model,
  year,
  transmission,
  mileage,
  reservePrice = 0
}: ValuationContentProps) => {
  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold text-center mb-6">
          Vehicle Valuation Result
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-6">
        <VehicleDetails
          make={make}
          model={model}
          year={year}
          transmission={transmission}
          mileage={mileage}
        />
        
        <ValuationDisplay reservePrice={reservePrice} />
      </div>
    </DialogContent>
  );
};
