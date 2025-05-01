
/**
 * Refactored from original useFormPersistence.ts
 * Hook for managing form data persistence with optimistic updates and offline support
 * 
 * Changes made:
 * - 2025-06-04: Increased debounce time from 500ms to 3000ms
 * - 2025-06-04: Increased auto-save interval from 10s to 60s
 * - 2025-06-04: Added ability to temporarily suspend auto-save during operations like image uploads
 * - 2025-06-04: Improved change detection to reduce unnecessary saves
 * - 2025-06-04: Added better error handling for cross-origin issues
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

// Increased these durations to reduce save frequency
const AUTO_SAVE_INTERVAL = 60000; // Changed from 10 seconds to 60 seconds
const SAVE_DEBOUNCE = 3000; // Changed from 500ms to 3 seconds

export const useFormPersistence = ({
  form,
  userId,
  carId,
  currentStep
}: UseFormPersistenceProps): UseFormPersistenceResult => {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [customOfflineStatus, setCustomOfflineStatus] = useState<boolean | null>(null);
  const [autoSavePaused, setAutoSavePaused] = useState(false); // New state to control auto-save
  const networkStatus = useOfflineStatus();
  const abortControllerRef = useRef<AbortController>();
  const pendingSaveRef = useRef<Promise<any> | null>(null);
  const consecutiveErrorsRef = useRef(0); // Track errors to prevent excessive retries
  
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

  // Add methods to pause and resume auto-save
  const pauseAutoSave = useCallback(() => {
    setAutoSavePaused(true);
  }, []);

  const resumeAutoSave = useCallback(() => {
    setAutoSavePaused(false);
  }, []);

  // Safe function to handle postMessage errors
  const safePostMessage = useCallback((data: any) => {
    try {
      if (window.parent !== window) {
        // Only attempt postMessage if we're in an iframe
        window.parent.postMessage(data, '*');
      }
    } catch (error) {
      // Silently fail - we don't want to crash the app or spam console with errors
      if (consecutiveErrorsRef.current === 0) {
        console.warn('Cross-origin communication error suppressed');
      }
      consecutiveErrorsRef.current++;
      
      // Reset error counter periodically
      if (consecutiveErrorsRef.current === 1) {
        setTimeout(() => {
          consecutiveErrorsRef.current = 0;
        }, 5000);
      }
    }
  }, []);

  // Save progress function with all necessary logic
  const saveFn = useCallback(async () => {
    const { userId, carId, currentStep, isOffline } = essentialValues;
    
    if (!userId || isOffline) return;
    
    const formData = form.getValues();
    
    // Skip save if auto-save is paused (unless it's a manual save)
    if (autoSavePaused && !pendingSaveRef.current) {
      return;
    }
    
    // Skip save if no changes detected
    if (!hasChanges(formData, carId)) {
      return; 
    }

    // Cancel pending request if new save comes in
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    try {
      setIsSaving(true);
      
      // Notify about saving (for debugging only in development)
      if (process.env.NODE_ENV === 'development') {
        safePostMessage({ type: 'FORM_SAVING', carId });
      }
      
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
      
      // Notify about successful save (for debugging only in development)
      if (process.env.NODE_ENV === 'development') {
        safePostMessage({ type: 'FORM_SAVED', carId: result.carId });
      }
      
      // Reset consecutive errors
      consecutiveErrorsRef.current = 0;
      
      return result.carId;
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Save failed:', error);
        
        // Only show toast for manual saves or rate-limited for auto-saves
        if (pendingSaveRef.current || consecutiveErrorsRef.current === 0) {
          toast.error('Failed to save progress', {
            description: 'Your changes are saved locally and will sync when online'
          });
        }
        
        consecutiveErrorsRef.current++;
      }
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [essentialValues, form, hasChanges, setLastSavedData, safePostMessage, autoSavePaused]);

  // Use our enhanced useDebounce hook with proper type safety
  const debouncedSave = useDebounce(saveFn, SAVE_DEBOUNCE);

  // Auto-save triggers - now conditional on autoSavePaused
  useEffect(() => {
    if (!essentialValues.userId || autoSavePaused) return;
    
    const formData = form.getValues();
    const unsubscribe = form.watch(() => {
      if (hasChanges(formData, carId)) {
        debouncedSave();
      }
    });
    
    return () => unsubscribe.unsubscribe();
  }, [form, debouncedSave, hasChanges, essentialValues.userId, carId, autoSavePaused]);

  // Periodic save insurance - also conditional on autoSavePaused
  useEffect(() => {
    if (!essentialValues.userId || autoSavePaused) return;
    
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
  }, [saveFn, hasChanges, essentialValues.userId, carId, form, autoSavePaused]);

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
    setIsOffline,
    pauseAutoSave,  // New method to pause auto-save
    resumeAutoSave  // New method to resume auto-save
  };
};
