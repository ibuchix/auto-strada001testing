
/**
 * Changes made:
 * - Improved layout and spacing
 * - Enhanced visual hierarchy with better typography
 * - Fixed alignment of status indicators
 * - Removed redundant save button from footer
 * - Added currentStep and totalSteps props for progress tracking
 */

import { format } from 'date-fns';
import { Wifi, WifiOff } from 'lucide-react';

interface FormFooterProps {
  lastSaved: Date | null;
  isOffline: boolean;
  onSave: () => void;
  isSaving?: boolean;
  currentStep?: number;
  totalSteps?: number;
}

export const FormFooter = ({
  lastSaved,
  isOffline,
  onSave,
  isSaving = false,
  currentStep,
  totalSteps
}: FormFooterProps) => {
  return (
    <div className="flex justify-between items-center py-3 px-4 border-t border-gray-200 bg-gray-50 rounded-b-lg mt-4 text-sm">
      <div className="flex items-center gap-4">
        {isOffline ? (
          <div className="flex items-center text-amber-600">
            <WifiOff className="h-4 w-4 mr-2" />
            <span>Offline</span>
          </div>
        ) : (
          <div className="flex items-center text-green-600">
            <Wifi className="h-4 w-4 mr-2" />
            <span>Connected</span>
          </div>
        )}
        
        {currentStep && totalSteps && (
          <div className="text-muted-foreground">
            Step {currentStep} of {totalSteps}
          </div>
        )}
      </div>
      
      {lastSaved && (
        <span className="text-subtitle">
          Last saved: {format(lastSaved, 'HH:mm, dd MMM yyyy')}
        </span>
      )}
    </div>
  );
};
