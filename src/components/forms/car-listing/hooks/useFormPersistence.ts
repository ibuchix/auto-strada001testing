
/**
 * Changes made:
 * - 2024-03-19: Initial implementation of form persistence logic
 * - 2024-03-19: Added support for both local storage and backend persistence
 * - 2024-03-19: Implemented auto-save functionality
 * - 2024-08-08: Updated to save current step information
 * - 2024-08-09: Fixed type errors related to form_metadata field
 * - 2024-09-02: Enhanced reliability with improved error handling and offline support
 * - 2024-10-15: Refactored to use central offline status hook and cache service
 * - 2025-05-03: Added backup system and recovery mechanisms for form data
 * - 2025-06-16: Implemented optimizations to reduce save frequency
 * - 2025-06-16: Added debounce rate limiting for save operations
 * - 2025-06-18: Enhanced debounce implementation with proper type definitions
 * - 2025-06-19: Fixed TypeScript errors in debounce function implementation
 * - 2025-06-20: Improved error handling and UI feedback
 * - 2025-06-21: Optimized save operations to prevent UI blocking
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { transformFormToDbData, transformDbToFormData } from "../utils/formDataTransformers";
import { SAVE_DEBOUNCE_TIME } from "../constants";
import { saveFormData, clearSaveCache } from "../utils/formSaveUtils";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import { 
  CACHE_KEYS, 
  saveToCache, 
  getFromCache, 
  storePendingRequest,
  recoverFromBackup,
  getCacheState 
} from "@/services/offlineCacheService";

interface UseFormPersistenceOptions {
  diagnosticId?: string;
  enableBackup?: boolean;
  backupInterval?: number;
  saveDebounceTime?: number;
}

// Enhanced debounce utility with proper TypeScript typing and cancellation
function createDebouncedFunction<F extends (...args: any[]) => any>(
  func: F,
  waitFor: number
) {
  let timeout: NodeJS.Timeout | null = null;
  
  // Function to execute the debounced function
  const execute = (...args: Parameters<F>): Promise<ReturnType<F>> => {
    return new Promise(resolve => {
      // Clear existing timeout
      if (timeout) {
        clearTimeout(timeout);
      }
      
      // Set new timeout
      timeout = setTimeout(() => {
        const result = func(...args);
        resolve(result as ReturnType<F>);
      }, waitFor);
    });
  };
  
  // Function to cancel the debounced function
  const cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };
  
  // Return both functions
  return {
    execute,
    cancel
  };
}

export const useFormPersistence = (
  form: UseFormReturn<CarListingFormData>,
  userId?: string,
  currentStep: number = 0,
  options: UseFormPersistenceOptions = {}
) => {
  const { 
    diagnosticId,
    enableBackup = true,
    backupInterval = 60000, // 1 minute
    saveDebounceTime = SAVE_DEBOUNCE_TIME
  } = options;
  
  const { watch, setValue, getValues } = form;
  const formData = watch();
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [backupCreated, setBackupCreated] = useState<Date | null>(null);
  const [recoveryAttempted, setRecoveryAttempted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const pendingSavesRef = useRef<CarListingFormData | null>(null);
  const carIdRef = useRef<string | undefined>(undefined);
  const saveInProgressRef = useRef(false);
  const backupIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousDataRef = useRef<string>("");
  
  // Store diagnosticId in cache for logging purposes
  useEffect(() => {
    if (diagnosticId) {
      saveToCache(CACHE_KEYS.DIAGNOSTIC_ID, diagnosticId);
    }
  }, [diagnosticId]);
  
  // Log function for diagnostic information
  const logAction = (action: string, details?: any) => {
    if (diagnosticId) {
      console.log(`[${diagnosticId}] [FormPersistence] ${action}:`, {
        ...(details || {}),
        carId: carIdRef.current,
        currentStep,
        lastSaved: lastSaved?.toISOString(),
        timestamp: new Date().toISOString()
      });
    }
  };
  
  // Use the centralized offline status hook
  const { isOffline } = useOfflineStatus({
    onOnline: () => {
      // When coming back online, try to save any pending saves
      logAction('Network online', { pendingSave: !!pendingSavesRef.current });
      if (pendingSavesRef.current) {
        saveProgress(pendingSavesRef.current);
        pendingSavesRef.current = null;
      }
    },
    onOffline: () => {
      logAction('Network offline');
    }
  });

  // Create a backup of the current form state
  const createBackup = useCallback(() => {
    try {
      const currentValues = getValues();
      const timestamp = new Date().toISOString();
      
      // Save a backup of the current form state with timestamp
      const backupKey = `formBackup_${timestamp}`;
      localStorage.setItem(backupKey, JSON.stringify(currentValues));
      
      // Keep track of backup keys to limit how many we store
      const backupKeys = getFromCache<string[]>('formBackupKeys', []);
      backupKeys.push(backupKey);
      
      // Only keep last 5 backups
      if (backupKeys.length > 5) {
        const oldestKey = backupKeys.shift();
        if (oldestKey) localStorage.removeItem(oldestKey);
      }
      
      saveToCache('formBackupKeys', backupKeys);
      setBackupCreated(new Date());
      logAction('Backup created', { timestamp });
      
      return timestamp;
    } catch (error) {
      logAction('Backup creation failed', { error });
      return null;
    }
  }, [getValues]);
  
  // Attempt to recover from the latest backup
  const recoverFromLatestBackup = useCallback((): boolean => {
    try {
      logAction('Attempting recovery from backup');
      
      // Try to recover from official backup system first
      const recoveredData = recoverFromBackup(CACHE_KEYS.FORM_PROGRESS);
      if (recoveredData) {
        logAction('Recovered from system backup', { source: 'system' });
        
        Object.entries(recoveredData).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            setValue(key as any, value as any, {
              shouldValidate: false,
              shouldDirty: false
            });
          }
        });
        
        return true;
      }
      
      // Fall back to legacy backup system
      const backupKeys = getFromCache<string[]>('formBackupKeys', []);
      if (backupKeys.length === 0) {
        logAction('No backups available');
        return false;
      }
      
      // Get the most recent backup
      const latestBackupKey = backupKeys[backupKeys.length - 1];
      const backupData = localStorage.getItem(latestBackupKey);
      
      if (!backupData) {
        logAction('Backup data not found', { key: latestBackupKey });
        return false;
      }
      
      const parsedBackup = JSON.parse(backupData);
      logAction('Recovered from legacy backup', { key: latestBackupKey });
      
      // Apply recovered data to form
      Object.entries(parsedBackup).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          setValue(key as any, value as any, {
            shouldValidate: false,
            shouldDirty: false
          });
        }
      });
      
      return true;
    } catch (error) {
      logAction('Recovery failed', { error });
      return false;
    }
  }, [setValue]);

  // Create a debounced save function (properly typed)
  const debouncedSaveFn = useCallback(
    createDebouncedFunction(async (data: CarListingFormData) => {
      if (!userId || saveInProgressRef.current) return;
      
      // Compare with previous data to avoid unnecessary saves
      const currentDataString = JSON.stringify(data);
      if (currentDataString === previousDataRef.current) {
        logAction('Skipping save - data unchanged');
        return;
      }
      
      previousDataRef.current = currentDataString;
      saveInProgressRef.current = true;
      setIsSaving(true);
      
      try {
        // Always save to localStorage/cache immediately
        saveToCache(CACHE_KEYS.FORM_PROGRESS, data);
        saveToCache(CACHE_KEYS.FORM_STEP, String(currentStep));
        
        // Don't attempt backend save if offline
        if (isOffline) {
          pendingSavesRef.current = data;
          logAction('Stored as pending request', { reason: 'Offline' });
          return;
        }
        
        // Get valuation data from cache
        const valuationData = getFromCache('valuationData');
        if (!valuationData) {
          logAction('No valuation data found in cache');
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
          logAction('Backend save successful', { carId: result.carId });
        } else if (result.error) {
          logAction('Backend save failed', { error: result.error });
        }
      } catch (error: any) {
        logAction('Error in saveProgress', { error });
        // Store for later retry if save fails
        pendingSavesRef.current = data;
      } finally {
        saveInProgressRef.current = false;
        setIsSaving(false);
      }
    }, saveDebounceTime),
    [userId, isOffline, currentStep, saveDebounceTime]
  );

  // Save progress to both localStorage and backend
  const saveProgress = useCallback((data: CarListingFormData) => {
    // Always save to localStorage/cache immediately
    saveToCache(CACHE_KEYS.FORM_PROGRESS, data);
    saveToCache(CACHE_KEYS.FORM_STEP, String(currentStep));
    
    logAction('Starting save process', { immediate: true });
    
    // Trigger the debounced save
    debouncedSaveFn.execute(data);
  }, [debouncedSaveFn, currentStep]);

  // Immediately save without debouncing
  const saveImmediately = useCallback(() => {
    // Cancel any pending debounced saves
    debouncedSaveFn.cancel();
    
    // Get current form values
    const currentData = getValues();
    
    // Start saving immediately
    logAction('Saving immediately (bypassing debounce)');
    
    // Always save to localStorage/cache immediately
    saveToCache(CACHE_KEYS.FORM_PROGRESS, currentData);
    saveToCache(CACHE_KEYS.FORM_STEP, String(currentStep));
    
    // Return promise but don't block UI
    if (!userId || saveInProgressRef.current) {
      return Promise.resolve(false);
    }
    
    saveInProgressRef.current = true;
    setIsSaving(true);
    
    return new Promise<boolean>(async (resolve) => {
      try {
        // Get valuation data from cache
        const valuationData = getFromCache('valuationData');
        if (!valuationData) {
          logAction('No valuation data found in cache for immediate save');
          resolve(false);
          return;
        }
        
        // Save to backend using the enhanced saveFormData utility
        const result = await saveFormData(
          currentData, 
          userId, 
          valuationData, 
          carIdRef.current
        );
        
        if (result.success) {
          setLastSaved(new Date());
          if (result.carId) {
            carIdRef.current = result.carId;
          }
          logAction('Immediate backend save successful', { carId: result.carId });
          resolve(true);
        } else if (result.error) {
          logAction('Immediate backend save failed', { error: result.error });
          resolve(false);
        }
      } catch (error) {
        logAction('Error in immediate save', { error });
        resolve(false);
      } finally {
        saveInProgressRef.current = false;
        setIsSaving(false);
      }
    });
  }, [getValues, userId, currentStep]);

  // Set up auto-save when form data changes
  useEffect(() => {
    const handler = () => {
      saveProgress(formData);
    };
    
    // Use a less frequent interval for auto-save to reduce load
    const autoSaveInterval = setInterval(handler, 10000); // 10 seconds
    
    return () => {
      clearInterval(autoSaveInterval);
    };
  }, [formData, saveProgress]);

  // Set up periodic backups if enabled
  useEffect(() => {
    if (enableBackup) {
      backupIntervalRef.current = setInterval(() => {
        createBackup();
      }, backupInterval);
    }
    
    return () => {
      if (backupIntervalRef.current) {
        clearInterval(backupIntervalRef.current);
      }
    };
  }, [enableBackup, backupInterval, createBackup]);

  // Save on unmount
  useEffect(() => {
    return () => {
      logAction('Component unmounting, saving final state');
      
      // Cancel any pending debounced saves
      debouncedSaveFn.cancel();
      
      // Force immediate save without debounce on unmount
      if (userId && !saveInProgressRef.current) {
        const valuationData = getFromCache('valuationData');
        if (valuationData) {
          saveFormData(formData, userId, valuationData, carIdRef.current)
            .then(() => logAction('Final save on unmount completed'))
            .catch(error => logAction('Final save on unmount failed', { error }));
        }
      }
      
      // Create one final backup
      if (enableBackup) {
        createBackup();
      }
    };
  }, [formData, userId, enableBackup, createBackup, debouncedSaveFn]);

  // Restore progress on mount
  useEffect(() => {
    const restoreProgress = async () => {
      logAction('Attempting to restore progress');
      
      // First try to restore from backend if user is authenticated
      if (userId) {
        try {
          logAction('Fetching draft from backend');
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
            
            logAction('Restored draft from backend', { 
              carId: draftData.id, 
              updated_at: draftData.updated_at 
            });
            
            Object.entries(formValues).forEach(([key, value]) => {
              if (value !== undefined && value !== null) {
                setValue(key as any, value as any, {
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
          } else if (error) {
            logAction('Error fetching draft', { error });
          } else {
            logAction('No drafts found in backend');
          }
        } catch (error) {
          logAction('Error restoring draft', { error });
        }
      }

      // Fallback to cache if no backend data or not authenticated
      logAction('Attempting to restore from cache');
      const savedProgress = getFromCache<CarListingFormData>(CACHE_KEYS.FORM_PROGRESS);
      
      if (savedProgress) {
        try {
          logAction('Found saved progress in cache');
          
          Object.entries(savedProgress).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              setValue(key as any, value as any, {
                shouldValidate: false,
                shouldDirty: false
              });
            }
          });
        } catch (error) {
          logAction('Error restoring form progress from cache', { error });
          
          // If we couldn't restore from cache, try to recover from backup
          if (!recoveryAttempted) {
            const recovered = recoverFromLatestBackup();
            setRecoveryAttempted(true);
            
            if (!recovered) {
              toast.error("Failed to restore saved progress", {
                description: "Please check if all fields are filled correctly.",
                duration: 5000
              });
            } else {
              toast.success("Recovered from backup", {
                description: "Your form data has been restored from a backup.",
                duration: 3000
              });
            }
          }
        }
      } else {
        logAction('No saved progress found in cache');
      }
    };

    restoreProgress();
  }, [setValue, userId, recoverFromLatestBackup, recoveryAttempted]);

  // Log diagnostic information about cache state
  useEffect(() => {
    if (diagnosticId) {
      const cacheState = getCacheState();
      logAction('Cache state on mount', cacheState);
    }
    
    return () => {
      if (diagnosticId) {
        const cacheState = getCacheState();
        logAction('Cache state on unmount', cacheState);
      }
    };
  }, [diagnosticId]);

  return {
    lastSaved,
    isOffline,
    isSaving,
    saveProgress: () => saveProgress(formData),
    saveImmediately,
    carId: carIdRef.current,
    createBackup,
    recoverFromBackup: recoverFromLatestBackup,
    backupCreated,
    clearDraftCache: () => clearSaveCache(userId || '', carIdRef.current)
  };
};
