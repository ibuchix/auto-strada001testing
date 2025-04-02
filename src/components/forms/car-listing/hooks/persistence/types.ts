
/**
 * Types for form persistence functionality
 * Created during refactoring of useFormPersistence.ts
 */

import { CarListingFormData } from "@/types/forms";

export interface UseFormPersistenceResult {
  isSaving: boolean;
  lastSaved: Date | null;
  isOffline: boolean;
  saveImmediately: () => Promise<void>;
  setIsOffline: (status: boolean) => void;
}

export interface UseFormPersistenceProps {
  form: any; // Using any here as the extended form type is defined elsewhere
  userId: string;
  carId?: string;
  currentStep: number;
}

export interface SaveProgressResult {
  success: boolean;
  carId?: string;
  error?: Error;
}
