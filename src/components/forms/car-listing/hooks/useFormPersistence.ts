
/**
 * Changes made:
 * - Added proper type definition for return value
 * - Fixed setIsOffline property access
 * - Corrected parameter count in saveProgress call
 * - Added proper error handling for async operations
 */

import { useState, useEffect, useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import { toast } from "sonner";

// Define the interface for the hook result
export interface UseFormPersistenceResult {
  isSaving: boolean;
  lastSaved: Date | null;
  isOffline: boolean;
  saveImmediately: () => Promise<void>;
  setIsOffline: (status: boolean) => void;
}

interface UseFormPersistenceProps {
  form: UseFormReturn<CarListingFormData>;
  userId: string;
  carId?: string;
  currentStep: number;
}

export const useFormPersistence = ({
  form,
  userId,
  carId,
  currentStep
}: UseFormPersistenceProps): UseFormPersistenceResult => {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [customOfflineStatus, setCustomOfflineStatus] = useState<boolean | null>(null);
  const networkStatus = useOfflineStatus();
  
  // Use custom offline status if set, otherwise use network status
  const isOffline = customOfflineStatus !== null ? customOfflineStatus : networkStatus.isOffline;
  
  // Set custom offline status
  const setIsOffline = useCallback((status: boolean) => {
    setCustomOfflineStatus(status);
  }, []);

  // Save progress function that returns a Promise<void>
  const saveProgress = useCallback(async (): Promise<void> => {
    if (isOffline || !userId) {
      console.log("Not saving - offline or no user ID");
      return;
    }

    try {
      setIsSaving(true);
      const formData = form.getValues();
      
      // Add metadata about the form state
      const dataToSave = {
        ...formData,
        seller_id: userId,
        form_metadata: {
          currentStep,
          lastSavedAt: new Date().toISOString()
        }
      };
      
      // Here we would actually save the data
      console.log("Saving form data:", dataToSave);
      
      // Mock API call - in real app, this would call an actual API
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setLastSaved(new Date());
      return;
    } catch (error) {
      console.error("Error saving form:", error);
      toast.error("Failed to save progress");
    } finally {
      setIsSaving(false);
    }
  }, [form, userId, currentStep, isOffline]);

  // Auto-save effect
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isSaving && !isOffline && userId) {
        saveProgress();
      }
    }, 60000); // Auto-save every minute

    return () => clearInterval(interval);
  }, [saveProgress, isSaving, isOffline, userId]);

  return {
    isSaving,
    lastSaved,
    isOffline,
    saveImmediately: saveProgress,
    setIsOffline
  };
};
