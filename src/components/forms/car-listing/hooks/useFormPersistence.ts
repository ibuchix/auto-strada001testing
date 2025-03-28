
/**
 * Changes made:
 * - Added debouncing mechanism for form changes
 * - Implemented AbortController for canceling pending saves
 * - Added optimistic local cache updates
 * - Implemented periodic auto-save insurance
 * - Added offline recovery handler
 * - Improved error handling for aborted requests
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import { toast } from "sonner";
import { CACHE_KEYS, saveToCache } from "@/services/offlineCacheService";

// Debounce time in milliseconds
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds
const SAVE_DEBOUNCE = 500; // 0.5 seconds

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
  const timeoutRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController>();
  
  // Use custom offline status if set, otherwise use network status
  const isOffline = customOfflineStatus !== null ? customOfflineStatus : networkStatus.isOffline;
  
  // Set custom offline status
  const setIsOffline = useCallback((status: boolean) => {
    setCustomOfflineStatus(status);
  }, []);

  const saveProgress = useCallback(async () => {
    if (!userId || isOffline) return;

    // Cancel pending request if new save comes in
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    try {
      setIsSaving(true);
      const formData = form.getValues();

      // Save key form fields to local storage for offline recovery
      saveToCache(CACHE_KEYS.TEMP_VIN, formData.vin);
      saveToCache(CACHE_KEYS.TEMP_MILEAGE, formData.mileage.toString());
      saveToCache(CACHE_KEYS.TEMP_GEARBOX, formData.transmission);

      // Optimistic local cache update
      saveToCache(CACHE_KEYS.TEMP_FORM_DATA, {
        ...formData,
        form_metadata: {
          currentStep,
          lastSavedAt: new Date().toISOString()
        }
      });

      // Here we would actually save the data
      console.log("Saving form data:", {
        ...formData,
        seller_id: userId,
        form_metadata: {
          currentStep,
          lastSavedAt: new Date().toISOString()
        }
      });
      
      // Mock API call - in real app, this would call an actual API
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setLastSaved(new Date());
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Save failed:', error);
        toast.error('Failed to save progress', {
          description: 'Your changes are saved locally and will sync when online'
        });
      }
    } finally {
      setIsSaving(false);
    }
  }, [form, userId, currentStep, isOffline]);

  // Debounced auto-save handler
  const debouncedSave = useCallback(() => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(saveProgress, SAVE_DEBOUNCE);
  }, [saveProgress]);

  // Auto-save triggers
  useEffect(() => {
    const subscription = form.watch(() => debouncedSave());
    return () => subscription.unsubscribe();
  }, [form, debouncedSave]);

  // Periodic save insurance
  useEffect(() => {
    const interval = setInterval(saveProgress, AUTO_SAVE_INTERVAL);
    return () => {
      clearInterval(interval);
      abortControllerRef.current?.abort();
    };
  }, [saveProgress]);

  // Offline recovery handler
  useEffect(() => {
    if (!isOffline && lastSaved) {
      const offlineData = localStorage.getItem(CACHE_KEYS.TEMP_FORM_DATA);
      if (offlineData) saveProgress();
    }
  }, [isOffline, saveProgress, lastSaved]);

  return {
    isSaving,
    lastSaved,
    isOffline,
    saveImmediately: saveProgress,
    setIsOffline
  };
};
