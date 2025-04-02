
/**
 * Form Footer Component
 * Displays form save status, offline status, and step progress
 * - 2024-06-05: Removed duplicate progress indicator to simplify UI
 * - Improved layout and visual feedback
 */

import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { Save, WifiOff } from "lucide-react";

export interface FormFooterProps {
  lastSaved: Date | null;
  isOffline: boolean;
  onSave: () => Promise<void>;
  isSaving: boolean;
  currentStep: number;
  totalSteps: number;
  completionPercentage?: number;
}

export const FormFooter = ({ 
  lastSaved, 
  isOffline, 
  onSave, 
  isSaving,
  currentStep,
  totalSteps
}: FormFooterProps) => {
  return (
    <div className="pt-3 border-t">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-sm text-gray-500">
        <div className="flex items-center gap-2 mb-2 sm:mb-0">
          {isOffline && (
            <div className="flex items-center text-amber-600 gap-1">
              <WifiOff className="h-4 w-4" />
              <span>Offline Mode</span>
            </div>
          )}
          
          {lastSaved && (
            <div className="text-gray-500">
              Last saved: {formatDistanceToNow(lastSaved, { addSuffix: true })}
            </div>
          )}
          
          {!lastSaved && !isOffline && (
            <div className="text-gray-400">Unsaved changes</div>
          )}
          
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs"
            onClick={onSave}
            disabled={isSaving || isOffline}
          >
            <Save className="h-3 w-3 mr-1" />
            {isSaving ? "Saving..." : "Save now"}
          </Button>
        </div>
        
        <div className="text-xs text-right">
          Step {currentStep} of {totalSteps}
        </div>
      </div>
    </div>
  );
};
