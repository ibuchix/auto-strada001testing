
/**
 * Form Footer Component
 * Displays form save status, offline status, and step progress
 * - Added progress indicator to show completion status
 * - Improved layout and visual feedback
 */

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatDistanceToNow } from "date-fns";
import { Save, WifiOff, CheckCircle } from "lucide-react";

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
  totalSteps,
  completionPercentage = 0
}: FormFooterProps) => {
  return (
    <div className="space-y-3 pt-3 border-t">
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
      
      {/* Form Completion Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-500">Overall completion</span>
          <div className="flex items-center gap-1">
            <span className="font-medium text-[#DC143C]">{Math.round(completionPercentage)}%</span>
            {completionPercentage === 100 && (
              <CheckCircle className="h-3 w-3 text-green-600" />
            )}
          </div>
        </div>
        <Progress 
          value={completionPercentage} 
          className="h-1.5"
          indicatorClassName={completionPercentage === 100 ? "bg-green-600" : "bg-[#DC143C]"}
        />
      </div>
    </div>
  );
};
