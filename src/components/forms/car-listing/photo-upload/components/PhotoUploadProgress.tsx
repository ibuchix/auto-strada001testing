
/**
 * Component for displaying photo upload progress and validation status
 * - 2025-04-05: Enhanced with better visual styling and clearer status indicators
 * - 2025-04-05: Added animations for state transitions and improved progress feedback
 * - 2025-04-05: Integrated brand colors for validation states
 * - 2025-04-06: Harmonized styling with app design language
 */
import React, { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { ValidationError } from "../../utils/validation";
import { ValidationSummary } from "./ValidationSummary";
import { allRequiredPhotos } from "../data/requiredPhotoData";
import { usePhotoValidation } from "../hooks/usePhotoValidation";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { cn } from "@/lib/utils";

interface PhotoUploadProgressProps {
  completionPercentage: number;
  totalPhotos: number;
  uploadedPhotos: Record<string, boolean>;
  validationErrors?: ValidationError[];
  onValidationChange?: (isValid: boolean) => void;
}

export const PhotoUploadProgress = ({
  completionPercentage,
  totalPhotos,
  uploadedPhotos,
  validationErrors,
  onValidationChange
}: PhotoUploadProgressProps) => {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  
  // Create a minimal form-compatible object that provides the data needed by usePhotoValidation
  const formWrapper = {
    watch: () => Object.keys(uploadedPhotos).filter(key => uploadedPhotos[key]),
    setValue: () => {},
    getValues: () => ({}),
    // Add other required properties from UseFormReturn as needed with empty implementations
  } as unknown as UseFormReturn<CarListingFormData>;
  
  const { 
    isValid, 
    getMissingPhotoTitles 
  } = usePhotoValidation(formWrapper);

  // Call the validation change callback when isValid changes
  React.useEffect(() => {
    if (onValidationChange) {
      onValidationChange(isValid);
    }
  }, [isValid, onValidationChange]);
  
  // Animate the progress percentage
  useEffect(() => {
    if (completionPercentage > animatedPercentage) {
      const interval = setInterval(() => {
        setAnimatedPercentage(prev => {
          const next = Math.min(prev + 1, completionPercentage);
          if (next === completionPercentage) {
            clearInterval(interval);
          }
          return next;
        });
      }, 20);
      return () => clearInterval(interval);
    } else if (completionPercentage < animatedPercentage) {
      // Handle decreasing progress (less common but still possible)
      setAnimatedPercentage(completionPercentage);
    }
  }, [completionPercentage, animatedPercentage]);
  
  const missingPhotoTitles = getMissingPhotoTitles();
  
  // Dynamic progress color based on completion percentage
  const progressColor = isValid 
    ? "bg-success" 
    : completionPercentage > 70 
      ? "bg-amber-400" 
      : "bg-primary";
  
  const uploadedCount = Object.values(uploadedPhotos).filter(Boolean).length;
  
  return (
    <div className="space-y-4 transition-all duration-300 p-4 border border-accent rounded-md bg-accent/5">
      {/* Progress bar */}
      <div className="space-y-2.5">
        <div className="flex justify-between text-sm items-center">
          <span className="font-kanit text-body">Photo Upload Progress</span>
          <span 
            className={cn(
              "font-kanit text-sm font-medium transition-colors duration-300",
              isValid 
                ? "text-success" 
                : completionPercentage > 70 
                  ? "text-amber-500" 
                  : "text-primary"
            )}
          >
            {animatedPercentage}%
          </span>
        </div>
        
        <Progress 
          value={animatedPercentage} 
          className="h-2.5 bg-accent/80 transition-all duration-500" 
          indicatorClassName={cn(
            "transition-all duration-500", 
            progressColor
          )}
        />
        
        <p className="text-sm text-subtitle flex justify-between items-center">
          <span>
            <span className="font-medium">{uploadedCount}</span> of <span className="font-medium">{totalPhotos}</span> photos uploaded
          </span>
          {isValid && (
            <span className="text-success font-kanit text-xs bg-success/10 px-2 py-0.5 rounded-full animate-fade-in">
              All Required Photos Complete
            </span>
          )}
        </p>
      </div>

      {/* Validation summary */}
      {(isValid || missingPhotoTitles.length > 0) && (
        <ValidationSummary
          isValid={isValid}
          missingPhotoTitles={missingPhotoTitles}
          completionPercentage={completionPercentage}
        />
      )}
    </div>
  );
};
