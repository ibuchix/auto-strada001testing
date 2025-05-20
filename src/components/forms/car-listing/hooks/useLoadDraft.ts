
/**
 * Hook for loading draft data into the form
 * Created: 2025-05-23 - Extracted from useFormContentInit for better flexibility
 */

import { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { toast } from "sonner";

// Interface for the options
export interface LoadDraftOptions {
  userId: string;
  draftId?: string;
  retryCount?: number;
  onLoaded?: (draft: any) => void;
  onError?: (error: Error) => void;
}

export const useLoadDraft = (
  options: LoadDraftOptions,
  form: UseFormReturn<CarListingFormData>
) => {
  const { userId, draftId, retryCount = 0, onLoaded, onError } = options;
  
  const [isLoading, setIsLoading] = useState(!!draftId);
  const [error, setError] = useState<Error | null>(null);
  const [draft, setDraft] = useState<any>(null);

  useEffect(() => {
    // If no draftId, no need to load
    if (!draftId) {
      setIsLoading(false);
      return;
    }
    
    const loadDraft = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Implement actual draft loading logic here
        // For now, we'll just use a placeholder
        console.log(`Loading draft ${draftId} for user ${userId}, retry: ${retryCount}`);
        
        // Simulate a successful fetch
        const mockDraft = {
          carId: draftId,
          id: draftId,
          make: "Test",
          model: "Car",
          year: 2025,
          updatedAt: new Date()
        };
        
        // Wait a bit to simulate loading
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Update the form with the draft data
        form.reset(mockDraft as any);
        
        // Set the loaded draft
        setDraft(mockDraft);
        
        // Call the onLoaded callback
        if (onLoaded) {
          onLoaded(mockDraft);
        }
        
        toast.success("Draft loaded successfully");
      } catch (err) {
        console.error("Error loading draft:", err);
        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError(errorObj);
        
        // Call the onError callback
        if (onError) {
          onError(errorObj);
        }
        
        toast.error("Failed to load draft", {
          description: "Please try again or create a new listing"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDraft();
  }, [draftId, userId, retryCount, form, onLoaded, onError]);

  return { isLoading, error, draft };
};
