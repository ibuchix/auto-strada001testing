
/**
 * Refactored from original useFormPersistence.ts
 * Hook for managing form data persistence with optimistic updates and offline support
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { CarListingFormData } from "@/types/forms";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import { toast } from "sonner";
import { TimeoutDurations } from "@/utils/timeoutUtils";
import { useDebounce } from "@/hooks/useTimeout";
import { UseFormPersistenceProps, UseFormPersistenceResult } from "./types";
import { saveProgress } from "./saveUtils";
import { useChangeDetection } from "./useChangeDetection";

// Debounce time in milliseconds
const AUTO_SAVE_INTERVAL = TimeoutDurations.MEDIUM; // 10 seconds - changed from STANDARD
const SAVE_DEBOUNCE = 500; // 0.5 seconds

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
  const abortControllerRef = useRef<AbortController>();
  const pendingSaveRef = useRef<Promise<any> | null>(null);
  
  // Use change detection hook
  const { hasChanges, setLastSavedData } = useChangeDetection();
  
  // Use custom offline status if set, otherwise use network status
  const isOffline = customOfflineStatus !== null ? customOfflineStatus : networkStatus.isOffline;
  
  // Set custom offline status
  const setIsOffline = useCallback((status: boolean) => {
    setCustomOfflineStatus(status);
  }, []);

  // Memoize key values to prevent unnecessary re-renders
  const essentialValues = useMemo(() => ({
    userId,
    carId,
    currentStep,
    isOffline
  }), [userId, carId, currentStep, isOffline]);

  // Save progress function with all necessary logic
  const saveFn = useCallback(async () => {
    const { userId, carId, currentStep, isOffline } = essentialValues;
    
    if (!userId || isOffline) return;
    
    const formData = form.getValues();
    if (!hasChanges(formData, carId)) return; 

    // Cancel pending request if new save comes in
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    try {
      setIsSaving(true);
      
      // Call the saveProgress utility function
      const result = await saveProgress(
        formData,
        userId,
        currentStep,
        carId,
        abortControllerRef.current
      );
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to save draft');
      }
      
      // Update saved data reference for change detection
      setLastSavedData(formData);
      
      // Update last saved timestamp
      setLastSaved(new Date());
      
      return result.carId;
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Save failed:', error);
        toast.error('Failed to save progress', {
          description: 'Your changes are saved locally and will sync when online'
        });
      }
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [essentialValues, form, hasChanges, setLastSavedData]);

  // Use our enhanced useDebounce hook with proper type safety
  const debouncedSave = useDebounce(saveFn, SAVE_DEBOUNCE);

  // Auto-save triggers
  useEffect(() => {
    if (!essentialValues.userId) return;
    
    const formData = form.getValues();
    const unsubscribe = form.watch(() => {
      if (hasChanges(formData, carId)) {
        debouncedSave();
      }
    });
    
    return () => unsubscribe.unsubscribe();
  }, [form, debouncedSave, hasChanges, essentialValues.userId, carId]);

  // Periodic save insurance
  useEffect(() => {
    if (!essentialValues.userId) return;
    
    const intervalTimer = setInterval(() => {
      const formData = form.getValues();
      if (hasChanges(formData, carId)) {
        saveFn();
      }
    }, AUTO_SAVE_INTERVAL);
    
    return () => {
      clearInterval(intervalTimer);
      abortControllerRef.current?.abort();
    };
  }, [saveFn, hasChanges, essentialValues.userId, carId, form]);

  // Offline recovery handler
  useEffect(() => {
    if (!isOffline && lastSaved) {
      const formData = form.getValues();
      if (hasChanges(formData, carId)) saveFn();
    }
  }, [isOffline, saveFn, lastSaved, hasChanges, carId, form]);

  // Implementation for immediate save with proper Promise handling
  const saveImmediately = useCallback(async (): Promise<void> => {
    try {
      // If there's a pending save, wait for it to complete first
      if (pendingSaveRef.current) {
        await pendingSaveRef.current;
      }
      
      // Start a new save operation
      pendingSaveRef.current = saveFn();
      await pendingSaveRef.current;
      
      // Clear the pending save reference
      pendingSaveRef.current = null;
    } catch (error) {
      console.error('Error in saveImmediately:', error);
      pendingSaveRef.current = null;
    }
  }, [saveFn]);

  return {
    isSaving,
    lastSaved,
    isOffline,
    saveImmediately,
    setIsOffline
  };
};
