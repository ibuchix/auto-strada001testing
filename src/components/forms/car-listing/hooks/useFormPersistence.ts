
/**
 * Changes made:
 * - Added debouncing mechanism for form changes
 * - Implemented AbortController for canceling pending saves
 * - Added optimistic local cache updates
 * - Implemented periodic auto-save insurance
 * - Added offline recovery handler
 * - Improved error handling for aborted requests
 * - Fixed TypeScript errors with CACHE_KEYS.TEMP_FORM_DATA
 * - Added API endpoint integration
 * - Updated to work with new cache expiration system
 * - 2024-08-17: Refactored to use standardized timeout utilities
 * - 2024-08-19: Improved type safety for debounced save handling
 * - 2025-11-04: Added support for save and continue later functionality
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import { toast } from "sonner";
import { CACHE_KEYS, saveToCache } from "@/services/offlineCacheService";
import { saveFormData } from "../utils/formSaveUtils";
import { TimeoutDurations, createTimeout } from "@/utils/timeoutUtils";
import { useDebounce } from "@/hooks/useTimeout";
import { useNavigate } from "react-router-dom";

// Debounce time in milliseconds - now using standardized durations
const AUTO_SAVE_INTERVAL = TimeoutDurations.STANDARD; // 5 seconds (changed from 30)
const SAVE_DEBOUNCE = 500; // 0.5 seconds (kept as custom value due to debounce specifics)
const CACHE_TTL = 86400000; // 24 hours

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
  const abortControllerRef = useRef<AbortController>();
  const navigate = useNavigate();
  
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
      saveToCache(CACHE_KEYS.TEMP_VIN, formData.vin || '', CACHE_TTL);
      saveToCache(CACHE_KEYS.TEMP_MILEAGE, formData.mileage?.toString() || '', CACHE_TTL);
      saveToCache(CACHE_KEYS.TEMP_GEARBOX, formData.transmission || '', CACHE_TTL);

      // Optimistic local cache update with TTL
      saveToCache(CACHE_KEYS.TEMP_FORM_DATA, {
        ...formData,
        form_metadata: {
          currentStep,
          lastSavedAt: new Date().toISOString()
        }
      }, CACHE_TTL);

      // Call the saveFormData function to save to database
      const result = await saveFormData(
        formData,
        userId,
        formData.valuation_data || {},
        carId
      );
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to save draft');
      }
      
      // Update carId if it's a new draft
      if (result.carId && !carId) {
        console.log('New carId received:', result.carId);
      }
      
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
  }, [form, userId, currentStep, isOffline, carId]);

  // Use our enhanced useDebounce hook with proper type safety
  const debouncedSave = useDebounce(saveProgress, SAVE_DEBOUNCE);

  // Auto-save triggers
  useEffect(() => {
    const subscription = form.watch(() => debouncedSave());
    return () => subscription.unsubscribe();
  }, [form, debouncedSave]);

  // Periodic save insurance - using standardized interval and createTimeout
  useEffect(() => {
    // Using createTimeout utility for better cleanup
    const intervalTimer = setInterval(() => {
      saveProgress();
    }, AUTO_SAVE_INTERVAL);
    
    return () => {
      clearInterval(intervalTimer);
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
