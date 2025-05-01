
/**
 * Types for form persistence functionality
 * - 2025-06-04: Added pauseAutoSave and resumeAutoSave methods
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
  pauseAutoSave: () => void;     // New method to pause auto-save
  resumeAutoSave: () => void;    // New method to resume auto-save
}
