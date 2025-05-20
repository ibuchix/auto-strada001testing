
/**
 * Hook for loading draft data
 * Updated: 2025-05-20 - Fixed CarEntity import and updated field names to use snake_case
 */

import { useCallback, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { consolidatePhotoFields } from "../submission/utils/photoProcessor";

export type LoadDraftResult = {
  success: boolean;
  error?: Error;
  data?: CarListingFormData;
};

export const useLoadDraft = (form: UseFormReturn<CarListingFormData>) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Function to load draft data into the form
  const loadDraft = useCallback(
    async (carId: string): Promise<LoadDraftResult> => {
      if (!carId) {
        const error = new Error("No car ID provided");
        setError(error);
        return { success: false, error };
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Simulate API call to fetch draft data
        // In a real app, this would be an API call
        const response = await fetch(`/api/cars/${carId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to load draft: ${response.statusText}`);
        }
        
        const carData = await response.json();
        
        if (!carData) {
          throw new Error("No draft data found");
        }
        
        // Process data to ensure it's compatible with form schema
        const processedData = consolidatePhotoFields(carData).updatedFormData;
        
        // Set form values with processed data
        form.reset(processedData);
        
        return { success: true, data: processedData };
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setError(err);
        return { success: false, error: err };
      } finally {
        setIsLoading(false);
      }
    },
    [form]
  );
  
  return { loadDraft, isLoading, error };
};
