
/**
 * Component for managing valuation-related dialogs
 * Created: 2025-04-17
 */

import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ExistingVehicleDialog } from "./dialogs/ExistingVehicleDialog";
import { ErrorDialog } from "./ErrorDialog";

interface ValuationDialogManagerProps {
  error?: string;
  isExisting?: boolean;
  isOffline?: boolean;
  onClose: () => void;
  onRetry?: () => void;
  onManualValuation?: () => void;
  showManualOption?: boolean;
}

export const ValuationDialogManager = ({
  error,
  isExisting,
  isOffline,
  onClose,
  onRetry,
  onManualValuation,
  showManualOption = true
}: ValuationDialogManagerProps) => {
  if (isExisting) {
    return <ExistingVehicleDialog onClose={onClose} onRetry={onRetry} />;
  }

  return (
    <ErrorDialog
      error={error || 'An error occurred during valuation'}
      onClose={onClose}
      onRetry={onRetry}
      showManualOption={showManualOption}
      onManualValuation={onManualValuation}
      isOffline={isOffline}
    />
  );
};
