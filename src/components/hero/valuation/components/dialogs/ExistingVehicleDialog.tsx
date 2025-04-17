
/**
 * Changes made:
 * - 2024-03-19: Created ExistingVehicleDialog component extracted from ValuationResult
 * - 2025-04-17: Added valuation prop to support detailed error information
 */

import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { ValuationData } from "@/utils/valuation/valuationDataTypes";

interface ExistingVehicleDialogProps {
  onClose: () => void;
  onRetry?: () => void;
  valuation?: Partial<ValuationData>;
}

export const ExistingVehicleDialog = ({ onClose, onRetry, valuation }: ExistingVehicleDialogProps) => {
  // Extract vehicle details if available
  const vehicleName = valuation?.make && valuation?.model 
    ? `${valuation.year || ''} ${valuation.make} ${valuation.model}` 
    : 'This vehicle';

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold text-center mb-4 flex items-center justify-center gap-2">
          <AlertCircle className="h-6 w-6 text-[#DC143C]" />
          Vehicle Already Listed
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4 text-center">
        <p className="text-subtitle">
          {vehicleName} has already been listed in our system. Each vehicle can only be listed once.
        </p>
        <div className="bg-accent/50 p-4 rounded-lg">
          <p className="text-sm text-subtitle">
            If you believe this is an error or need assistance, please contact our support team.
          </p>
        </div>
      </div>

      <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6">
        <Button 
          variant="outline"
          onClick={onClose}
          className="w-full sm:w-auto"
        >
          Close
        </Button>
        {onRetry && (
          <Button 
            onClick={onRetry}
            className="w-full sm:w-auto bg-[#DC143C] hover:bg-[#DC143C]/90 text-white"
          >
            Try Different VIN
          </Button>
        )}
      </DialogFooter>
    </DialogContent>
  );
};
