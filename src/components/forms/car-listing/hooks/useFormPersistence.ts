
/**
 * Changes made:
 * - 2024-03-19: Initial implementation of form persistence logic
 * - 2024-03-19: Added support for both local storage and backend persistence
 * - 2024-03-19: Implemented auto-save functionality
 * - 2024-08-08: Updated to save current step information
 * - 2024-08-09: Fixed type errors related to form_metadata field
 * - 2024-09-02: Enhanced reliability with improved error handling and offline support
 * - 2024-10-15: Refactored to use central offline status hook and cache service
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { transformFormToDbData, transformDbToFormData } from "../utils/formDataTransformers";
import { SAVE_DEBOUNCE_TIME } from "../constants";
import { saveFormData } from "../utils/formSaveUtils";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import { CACHE_KEYS, saveToCache, getFromCache, storePendingRequest } from "@/services/offlineCacheService";

export const useFormPersistence = (
  form: UseFormReturn<CarListingFormData>,
  userId?: string,
  currentStep: number = 0
) => {
  const { watch, setValue } = form;
  const formData = watch();
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const pendingSavesRef = useRef<CarListingFormData | null>(null);
  const carIdRef = useRef<string | undefined>(undefined);
  
  // Use the centralized offline status hook
  const { isOffline } = useOfflineStatus({
    onOnline: () => {
      // When coming back online, try to save any pending saves
      if (pendingSavesRef.current) {
        saveProgress(pendingSavesRef.current);
        pendingSavesRef.current = null;
      }
    }
  });

  // Save progress to both localStorage and backend
  const saveProgress = useCallback(async (data: CarListingFormData) => {
    // Always save to localStorage/cache immediately
    saveToCache(CACHE_KEYS.FORM_PROGRESS, data);
    saveToCache(CACHE_KEYS.FORM_STEP, String(currentStep));
    
    // Don't attempt backend save if offline or no user
    if (isOffline || !userId) {
      if (!isOffline && !userId) {
        console.warn('Not saving to backend: No user ID provided');
      }
      
      if (isOffline) {
        pendingSavesRef.current = data;
        // Store as a pending request for later processing
        if (userId) {
          const valuationData = getFromCache('valuationData');
          if (valuationData) {
            storePendingRequest({
              endpoint: '/cars',
              method: 'UPSERT',
              body: { formData: data, userId, valuationData, carId: carIdRef.current },
              id: carIdRef.current || 'new-car'
            });
          }
        }
      }
      
      return;
    }
    
    try {
      // Get valuation data from cache
      const valuationData = getFromCache('valuationData');
      if (!valuationData) {
        console.warn('No valuation data found in cache');
        return;
      }
      
      // Save to backend using the enhanced saveFormData utility
      const result = await saveFormData(
        data, 
        userId, 
        valuationData, 
        carIdRef.current
      );
      
      if (result.success) {
        setLastSaved(new Date());
        if (result.carId) {
          carIdRef.current = result.carId;
        }
      }
    } catch (error) {
      console.error('Error in saveProgress:', error);
      // Store for later retry if save fails
      pendingSavesRef.current = data;
    }
  }, [userId, isOffline, currentStep]);

  // Set up auto-save
  useEffect(() => {
    const debouncedSave = setTimeout(() => {
      saveProgress(formData);
    }, SAVE_DEBOUNCE_TIME);

    return () => {
      clearTimeout(debouncedSave);
    };
  }, [formData, saveProgress]);

  // Save on unmount
  useEffect(() => {
    return () => {
      saveProgress(formData);
    };
  }, [formData, saveProgress]);

  // Restore progress on mount
  useEffect(() => {
    const restoreProgress = async () => {
      // First try to restore from backend if user is authenticated
      if (userId) {
        try {
          const { data: draftData, error } = await supabase
            .from('cars')
            .select('*')
            .eq('seller_id', userId)
            .eq('is_draft', true)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!error && draftData) {
            carIdRef.current = draftData.id;
            const formValues = transformDbToFormData(draftData);
            Object.entries(formValues).forEach(([key, value]) => {
              if (value !== undefined && value !== null) {
                setValue(key as keyof CarListingFormData, value as any, {
                  shouldValidate: false,
                  shouldDirty: false
                });
              }
            });
            
            // Safely check if form_metadata exists and has current_step
            const metadata = draftData.form_metadata as Record<string, any> | null;
            if (metadata && typeof metadata === 'object' && 'current_step' in metadata) {
              saveToCache(CACHE_KEYS.FORM_STEP, String(metadata.current_step));
            }
            
            setLastSaved(new Date(draftData.updated_at || draftData.created_at));
            return;
          }
        } catch (error) {
          console.error('Error restoring draft:', error);
        }
      }

      // Fallback to cache if no backend data or not authenticated
      const savedProgress = getFromCache<CarListingFormData>(CACHE_KEYS.FORM_PROGRESS);
      if (savedProgress) {
        try {
          Object.entries(savedProgress).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              setValue(key as keyof CarListingFormData, value as any, {
                shouldValidate: false,
                shouldDirty: false
              });
            }
          });
        } catch (error) {
          console.error('Error restoring form progress:', error);
          toast.error("Failed to restore saved progress", {
            description: "Please check if all fields are filled correctly.",
            duration: 5000
          });
        }
      }
    };

    restoreProgress();
  }, [setValue, userId]);

  return {
    lastSaved,
    isOffline,
    saveProgress: () => saveProgress(formData),
    carId: carIdRef.current
  };
};
