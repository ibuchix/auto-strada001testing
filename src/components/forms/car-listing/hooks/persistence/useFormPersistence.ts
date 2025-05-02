
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
 * - 2025-06-07: Drastically reduced auto-save functionality in favor of manual saves
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { CarListingFormData } from "@/types/forms";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useTimeout";
import { UseFormPersistenceProps, UseFormPersistenceResult } from "./types";
import { saveProgress } from "./saveUtils";
import { useChangeDetection } from "./useChangeDetection";

// Greatly increased auto-save interval to reduce frequency
const AUTO_SAVE_INTERVAL = 300000; // 5 minutes instead of 1 minute
const SAVE_DEBOUNCE = 5000; // 5 seconds instead of 3 seconds

// Local storage key pattern
const getLocalStorageKey = (userId: string, carId?: string) => 
  `form_data_${userId}_${carId || 'new'}`;

export const useFormPersistence = ({
  form,
  userId,
  carId,
  currentStep
}: UseFormPersistenceProps): UseFormPersistenceResult => {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [customOfflineStatus, setCustomOfflineStatus] = useState<boolean | null>(null);
  const [autoSavePaused, setAutoSavePaused] = useState(false);
  const networkStatus = useOfflineStatus();
  const abortControllerRef = useRef<AbortController>();
  const pendingSaveRef = useRef<Promise<any> | null>(null);
  const consecutiveErrorsRef = useRef(0);
  
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

  // Save to local storage function
  const saveToLocalStorage = useCallback((formData: CarListingFormData) => {
    try {
      const key = getLocalStorageKey(userId, carId);
      localStorage.setItem(key, JSON.stringify({
        formData,
        timestamp: new Date().toISOString()
      }));
      console.log('Form data saved to local storage');
    } catch (error) {
      console.error('Error saving to local storage:', error);
    }
  }, [userId, carId]);

  // Load from local storage function
  const loadFromLocalStorage = useCallback(() => {
    try {
      const key = getLocalStorageKey(userId, carId);
      const storedData = localStorage.getItem(key);
      
      if (storedData) {
        const { formData, timestamp } = JSON.parse(storedData);
        console.log('Loaded data from local storage, timestamp:', new Date(timestamp));
        return formData;
      }
    } catch (error) {
      console.error('Error loading from local storage:', error);
    }
    return null;
  }, [userId, carId]);

  // Safe function to handle postMessage errors
  const safePostMessage = useCallback((data: any) => {
    try {
      if (window !== window.parent) {
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
    
    if (!userId) return;
    
    const formData = form.getValues();
    
    // Always save to local storage first (even when offline)
    saveToLocalStorage(formData);
    
    // If offline, don't try to save to database
    if (isOffline) {
      setLastSaved(new Date());
      return;
    }
    
    // Skip save if auto-save is paused (unless it's a manual save)
    if (autoSavePaused && !pendingSaveRef.current) {
      return;
    }
    
    // Skip save if no changes detected and it's not a manual save
    if (!hasChanges(formData, carId) && !pendingSaveRef.current) {
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
  }, [essentialValues, form, hasChanges, setLastSavedData, safePostMessage, autoSavePaused, saveToLocalStorage]);

  // Use our enhanced useDebounce hook with proper type safety
  const debouncedSave = useDebounce(saveFn, SAVE_DEBOUNCE);

  // Auto-save triggers - now conditional on autoSavePaused
  // Greatly reduced frequency - only watch for significant changes
  useEffect(() => {
    if (!essentialValues.userId || autoSavePaused) return;
    
    // Save to local storage on every significant change
    const saveLocally = () => {
      saveToLocalStorage(form.getValues());
    };
    
    // Watch only key fields that represent significant changes
    const keyFieldsToWatch = [
      'make', 'model', 'year', 'vin', 'mileage',
      'isDamaged', 'hasWarningLights', 'isRegisteredInPoland',
      'name', 'address', 'mobileNumber'
    ];
    
    const unsubscribe = form.watch((value, { name }) => {
      // Only trigger if a key field has changed
      if (keyFieldsToWatch.includes(name as string)) {
        saveLocally();
      }
    });
    
    return () => unsubscribe.unsubscribe();
  }, [form, saveToLocalStorage, essentialValues.userId, autoSavePaused]);

  // Very infrequent periodic save - only for backup
  useEffect(() => {
    if (!essentialValues.userId || autoSavePaused) return;
    
    const intervalTimer = setInterval(() => {
      // Always save to local storage, but only save to database if there are changes
      saveToLocalStorage(form.getValues());
      
      const formData = form.getValues();
      if (hasChanges(formData, carId) && !isOffline) {
        debouncedSave();
      }
    }, AUTO_SAVE_INTERVAL);
    
    return () => {
      clearInterval(intervalTimer);
      abortControllerRef.current?.abort();
    };
  }, [debouncedSave, hasChanges, essentialValues.userId, carId, form, autoSavePaused, isOffline, saveToLocalStorage]);

  // Offline recovery handler
  useEffect(() => {
    if (!isOffline && lastSaved) {
      const formData = form.getValues();
      if (hasChanges(formData, carId)) debouncedSave();
    }
  }, [isOffline, debouncedSave, lastSaved, hasChanges, carId, form]);

  // Load initial data from local storage if available (helps restore unsaved changes)
  useEffect(() => {
    if (essentialValues.userId) {
      const localData = loadFromLocalStorage();
      if (localData) {
        // Only update form if no data has been entered yet
        const currentValues = form.getValues();
        const hasEnteredData = currentValues.make || currentValues.model || currentValues.year;
        
        if (!hasEnteredData) {
          form.reset(localData);
          console.log('Restored unsaved form data from local storage');
        }
      }
    }
  }, [essentialValues.userId, form, loadFromLocalStorage]);

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
    pauseAutoSave,
    resumeAutoSave
  };
};
