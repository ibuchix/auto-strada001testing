
/**
 * Changes made:
 * - 2024-03-19: Initial implementation of form persistence logic
 * - 2024-03-19: Added support for both local storage and backend persistence
 * - 2024-03-19: Implemented auto-save functionality
 * - 2024-08-08: Updated to save current step information
 * - 2024-08-09: Fixed type errors related to form_metadata field
 * - 2024-09-02: Enhanced reliability with improved error handling and offline support
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { transformFormToDbData, transformDbToFormData } from "../utils/formDataTransformers";
import { SAVE_DEBOUNCE_TIME } from "../constants";
import { saveFormData } from "../utils/formSaveUtils";

export const useFormPersistence = (
  form: UseFormReturn<CarListingFormData>,
  userId?: string,
  currentStep: number = 0
) => {
  const { watch, setValue } = form;
  const formData = watch();
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const pendingSavesRef = useRef<CarListingFormData | null>(null);
  const carIdRef = useRef<string | undefined>(undefined);
  
  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // If we have pending saves, try to save them now
      if (pendingSavesRef.current) {
        saveProgress(pendingSavesRef.current);
        pendingSavesRef.current = null;
      }
    };
    
    const handleOffline = () => {
      setIsOffline(true);
      toast.warning("You are offline", { 
        description: "Your changes will be saved locally and synced when you're back online.",
        duration: 5000
      });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Set initial state
    setIsOffline(!navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save progress to both localStorage and backend
  const saveProgress = useCallback(async (data: CarListingFormData) => {
    // Always save to localStorage immediately
    localStorage.setItem('formProgress', JSON.stringify(data));
    localStorage.setItem('formCurrentStep', String(currentStep));
    
    // Don't attempt backend save if offline or no user
    if (isOffline || !userId) {
      if (!isOffline && !userId) {
        console.warn('Not saving to backend: No user ID provided');
      }
      
      if (isOffline) {
        pendingSavesRef.current = data;
      }
      
      return;
    }
    
    try {
      // Get valuation data from localStorage
      const valuationData = localStorage.getItem('valuationData');
      if (!valuationData) {
        console.warn('No valuation data found in localStorage');
        return;
      }
      
      const parsedValuationData = JSON.parse(valuationData);
      
      // Save to backend using the enhanced saveFormData utility
      const result = await saveFormData(
        data, 
        userId, 
        parsedValuationData, 
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
              localStorage.setItem('formCurrentStep', String(metadata.current_step));
            }
            
            setLastSaved(new Date(draftData.updated_at || draftData.created_at));
            return;
          }
        } catch (error) {
          console.error('Error restoring draft:', error);
        }
      }

      // Fallback to localStorage if no backend data or not authenticated
      const savedProgress = localStorage.getItem('formProgress');
      if (savedProgress) {
        try {
          const parsed = JSON.parse(savedProgress);
          Object.entries(parsed).forEach(([key, value]) => {
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
