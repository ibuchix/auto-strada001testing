
/**
 * Type definitions for form persistence hooks and utilities
 * Created: 2025-06-06
 */

import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";

export interface UseFormPersistenceProps {
  form: UseFormReturn<CarListingFormData>;
  userId: string;
  carId?: string;
  currentStep: number;
}

export interface UseFormPersistenceResult {
  isSaving: boolean;
  lastSaved: Date | null;
  isOffline: boolean;
  saveImmediately: () => Promise<void>;
  setIsOffline: (status: boolean) => void;
  pauseAutoSave: () => void;
  resumeAutoSave: () => void;
}
