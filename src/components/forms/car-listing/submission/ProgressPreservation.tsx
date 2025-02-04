import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";

export const ProgressPreservation = () => {
  const { watch, setValue } = useFormContext<CarListingFormData>();
  const formData = watch();

  useEffect(() => {
    // Save form progress to localStorage
    const saveProgress = () => {
      localStorage.setItem('formProgress', JSON.stringify(formData));
    };

    // Save progress every 30 seconds
    const intervalId = setInterval(saveProgress, 30000);

    // Save on unmount
    return () => {
      clearInterval(intervalId);
      saveProgress();
    };
  }, [formData]);

  useEffect(() => {
    // Restore progress on mount
    const savedProgress = localStorage.getItem('formProgress');
    if (savedProgress) {
      try {
        const parsed = JSON.parse(savedProgress);
        Object.entries(parsed).forEach(([key, value]) => {
          // Type check before setting value
          if (value !== undefined && value !== null) {
            setValue(key as keyof CarListingFormData, value as any, {
              shouldValidate: false,
              shouldDirty: false
            });
          }
        });
      } catch (error) {
        console.error('Error restoring form progress:', error);
      }
    }
  }, [setValue]);

  return null;
};