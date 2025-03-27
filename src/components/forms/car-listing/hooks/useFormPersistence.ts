
/**
 * Changes made:
 * - 2024-06-02: Created hook to manage form persistence
 * - 2024-08-08: Added loading state and error handling
 * - 2024-09-15: Improved offline detection and backup saving
 * - 2025-08-01: Updated to use options object pattern for better TypeScript
 * - 2025-08-02: Fixed interface to align with the saveImmediately method naming
 */

import { useState, useEffect, useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { saveFormData } from "../utils/formSaveUtils";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import { toast } from "sonner";

interface UseFormPersistenceOptions {
  form: UseFormReturn<CarListingFormData>;
  userId: string;
  carId?: string;
  currentStep: number;
  autoSaveInterval?: number;
  enableBackup?: boolean;
}

interface UseFormPersistenceResult {
  lastSaved: Date | null;
  isOffline: boolean;
  isSaving: boolean;
  saveImmediately: () => Promise<void>;
  setIsOffline: (status: boolean) => void;
}

export const useFormPersistence = (options: UseFormPersistenceOptions): UseFormPersistenceResult => {
  const { 
    form, 
    userId, 
    carId, 
    currentStep,
    autoSaveInterval = 30000,
    enableBackup = false 
  } = options;
  
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { isOffline, setIsOffline } = useOfflineStatus();
  
  // Save form data to database
  const saveFormData = useCallback(async () => {
    if (!userId || isSaving || isOffline) return;
    
    try {
      setIsSaving(true);
      
      // Get current form data
      const formData = form.getValues();
      
      // Add metadata about current step
      formData.form_metadata = {
        ...(formData.form_metadata || {}),
        currentStep,
        lastSavedAt: new Date().toISOString()
      };
      
      // Save to database (implementation details in formSaveUtils.ts)
      const result = await saveFormData(formData, userId, null, carId);
      
      if (result.success) {
        console.log("Form data saved successfully");
        setLastSaved(new Date());
        return result.carId;
      } else {
        console.error("Failed to save form data", result.error);
        
        // Handle offline case
        if (!navigator.onLine) {
          setIsOffline(true);
        }
      }
    } catch (error) {
      console.error("Error saving form data:", error);
    } finally {
      setIsSaving(false);
    }
  }, [form, userId, carId, currentStep, isSaving, isOffline, setIsOffline]);
  
  // Auto save on interval
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (form.formState.isDirty) {
        saveFormData();
      }
    }, autoSaveInterval);
    
    return () => clearInterval(intervalId);
  }, [form, saveFormData, autoSaveInterval]);
  
  // Save on online status change
  useEffect(() => {
    if (!isOffline && form.formState.isDirty) {
      saveFormData();
    }
  }, [isOffline, form.formState.isDirty, saveFormData]);
  
  // Save on unmount
  useEffect(() => {
    return () => {
      if (form.formState.isDirty) {
        saveFormData();
      }
    };
  }, []);
  
  return {
    lastSaved,
    isOffline,
    isSaving,
    saveImmediately: saveFormData,
    setIsOffline
  };
};
