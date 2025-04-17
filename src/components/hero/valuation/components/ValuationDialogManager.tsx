
/**
 * Component for managing valuation-related dialogs
 * Created: 2025-04-17
 * Updated: 2025-04-17 - Improved with standardized types and better error handling
 */

import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ExistingVehicleDialog } from "./dialogs/ExistingVehicleDialog";
import { ErrorDialog } from "./ErrorDialog";
import { ValuationData } from "@/utils/valuation/valuationDataTypes";

interface ValuationDialogManagerProps {
  error?: string;
  errorDetails?: string;
  isExisting?: boolean;
  isOffline?: boolean;
  valuation?: Partial<ValuationData>;
  onClose: () => void;
  onRetry?: () => void;
  onManualValuation?: () => void;
  showManualOption?: boolean;
}

export const ValuationDialogManager = ({
  error,
  errorDetails,
  isExisting,
  isOffline,
  valuation,
  onClose,
  onRetry,
  onManualValuation,
  showManualOption = true
}: ValuationDialogManagerProps) => {
  // Enhanced logging for debugging
  console.log('ValuationDialogManager rendered with:', { 
    isExisting, 
    hasError: !!error,
    errorMessage: error,
    hasValuation: !!valuation,
    valuationDataSample: valuation ? JSON.stringify(valuation).substring(0, 100) + '...' : 'none'
  });

  if (isExisting) {
    return <ExistingVehicleDialog 
      onClose={onClose} 
      onRetry={onRetry}
      valuation={valuation}
    />;
  }

  return (
    <ErrorDialog
      error={error || 'An error occurred during valuation'}
      errorDetails={errorDetails}
      onClose={onClose}
      onRetry={onRetry}
      showManualOption={showManualOption}
      onManualValuation={onManualValuation}
      isOffline={isOffline}
      valuation={valuation}
    />
  );
};
