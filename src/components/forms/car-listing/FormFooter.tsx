
/**
 * Form Footer Component
 * Provides status information and saving controls for multi-step forms
 * Created: 2025-04-05
 * Updated: 2025-04-06 - Added helpful tooltip and improved status indicators
 */

import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { format } from "date-fns";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface FormFooterProps {
  lastSaved: Date | null;
  isOffline: boolean;
  onSave: () => Promise<void>;
  isSaving: boolean;
  currentStep: number;
  totalSteps: number;
}

export const FormFooter = ({
  lastSaved,
  isOffline,
  onSave,
  isSaving,
  currentStep,
  totalSteps
}: FormFooterProps) => {
  // Handle manual save
  const handleSave = async () => {
    try {
      await onSave();
    } catch (error) {
      console.error("Error saving form:", error);
    }
  };
  
  // Format last saved timestamp
  const getLastSavedText = () => {
    if (!lastSaved) {
      return "Not saved yet";
    }
    
    try {
      return `Last saved: ${format(lastSaved, "HH:mm:ss")}`;
    } catch (e) {
      console.error("Date formatting error:", e);
      return "Last saved recently";
    }
  };
  
  // Calculate progress percentage
  const progressPercentage = Math.round((currentStep / totalSteps) * 100);
  
  return (
    <div className="flex flex-wrap items-center justify-between text-sm text-gray-500 pt-2">
      <div className="flex items-center space-x-2">
        <span className="font-medium">Step {currentStep} of {totalSteps}</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="w-[200px] h-1.5 bg-gray-100 rounded-full overflow-hidden relative cursor-help">
              <div 
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Form progress: {progressPercentage}%</p>
          </TooltipContent>
        </Tooltip>
      </div>
      
      <div className="flex items-center mt-2 sm:mt-0">
        {isOffline && (
          <span className="text-orange-500 mr-2 font-medium flex items-center">
            <span className="inline-block w-2 h-2 rounded-full bg-orange-500 mr-1 animate-pulse"></span>
            Offline Mode
          </span>
        )}
        
        <span className="mr-2">{getLastSavedText()}</span>
        
        <Button
          size="sm"
          variant="outline"
          onClick={handleSave}
          disabled={isSaving || isOffline}
          className="flex items-center space-x-1 text-xs"
        >
          <Save className={`h-3 w-3 ${isSaving ? 'animate-pulse' : ''}`} />
          <span>{isSaving ? "Saving..." : "Save"}</span>
        </Button>
      </div>
    </div>
  );
};
